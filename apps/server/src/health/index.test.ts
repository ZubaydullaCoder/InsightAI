// apps/server/src/health/index.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import session from 'express-session'

// ─── vi.hoisted mocks (must be declared before vi.mock factories) ─────────────

const mockEnv = vi.hoisted(() => ({
  DATABASE_URL:            'postgresql://test:test@localhost:5432/test',
  NODE_ENV:                'test' as const,
  PORT:                    3001,
  BOT_TOKEN:               'test-token',
  TELEGRAM_WEBHOOK_SECRET: 'test-secret',
  FILTER_MODE:             'keyword_gate' as const,
  AI_API_KEY:              'test-key',
  AI_MODEL:                'gemini-2.5-flash',
  SESSION_SECRET:          'test-session-secret',
}))

vi.mock('../shared/env.js', () => ({ env: mockEnv }))

// ─── Prisma mock ──────────────────────────────────────────────────────────────

const mockBatchHealthFindFirst = vi.hoisted(() => vi.fn())

vi.mock('../shared/db.js', () => ({
  prisma: {
    batchHealth: {
      findFirst: mockBatchHealthFindFirst,
    },
  },
}))

// ─── Logger mock ──────────────────────────────────────────────────────────────

const mockLoggerError = vi.hoisted(() => vi.fn())

vi.mock('../shared/logger.js', () => ({
  logger: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: mockLoggerError,
    debug: vi.fn(),
  },
}))

// Import after all vi.mock() calls
import { healthRouter } from './index.js'
import { requireAuth }   from '../auth/middleware.js'

// ─── Test app factory ─────────────────────────────────────────────────────────

function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 },
  }))

  // Helper route to set session (simulates successful login)
  app.post('/test/login', (req, res) => {
    req.session.userId     = req.body.userId     as number
    req.session.districtId = req.body.districtId as number
    res.json({ ok: true })
  })

  // Wire requireAuth BEFORE healthRouter — mirrors production web/index.ts ordering
  app.use('/api', requireAuth)
  app.use('/api', healthRouter)

  return app
}

const SESSION_DISTRICT_ID = 7

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  let app: ReturnType<typeof createTestApp>

  beforeEach(() => {
    app = createTestApp()
    vi.clearAllMocks()
  })

  // ── Authentication ──────────────────────────────────────────────────────────

  it('returns 401 for unauthenticated requests (requireAuth gate)', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized' })
  })

  // ── No completed rows → delayed, null lastBatchAt ──────────────────────────

  it('returns status delayed and null lastBatchAt when no completed batch_health rows exist', async () => {
    mockBatchHealthFindFirst.mockResolvedValueOnce(null)

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ lastBatchAt: null, status: 'delayed' })
  })

  // ── Session district scoping ────────────────────────────────────────────────

  it('queries batch_health with req.session.districtId only', async () => {
    mockBatchHealthFindFirst.mockResolvedValueOnce(null)

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    await agent.get('/api/health')

    expect(mockBatchHealthFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          district_id: SESSION_DISTRICT_ID,
          completed_at: { not: null },
        }),
      }),
    )
  })

  // ── Recent completed row → current ─────────────────────────────────────────

  it('returns status current when most recent completed_at is less than 25 minutes ago', async () => {
    const recentDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    mockBatchHealthFindFirst.mockResolvedValueOnce({ completed_at: recentDate })

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('current')
    expect(res.body.lastBatchAt).toBe(recentDate.toISOString())
  })

  // ── Old completed row → delayed ────────────────────────────────────────────

  it('returns status delayed when most recent completed_at is >= 25 minutes ago', async () => {
    const oldDate = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    mockBatchHealthFindFirst.mockResolvedValueOnce({ completed_at: oldDate })

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('delayed')
    expect(res.body.lastBatchAt).toBe(oldDate.toISOString())
  })

  // ── Exactly at 25-minute threshold → delayed ───────────────────────────────

  it('returns status delayed when completed_at is exactly 25 minutes ago', async () => {
    const exactThreshold = new Date(Date.now() - 25 * 60 * 1000)
    mockBatchHealthFindFirst.mockResolvedValueOnce({ completed_at: exactThreshold })

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('delayed')
  })

  // ── Prisma failure → 500 with logger context ───────────────────────────────

  it('returns 500 and logs when Prisma throws', async () => {
    const dbError = new Error('DB connection refused')
    mockBatchHealthFindFirst.mockRejectedValueOnce(dbError)

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(500)
    expect(res.body).toMatchObject({
      statusCode: 500,
      error:      'Internal Server Error',
      message:    'Health check failed',
    })
    expect(mockLoggerError).toHaveBeenCalledWith(
      { err: dbError },
      'Health endpoint query failed',
    )
  })

  // ── Response shape ──────────────────────────────────────────────────────────

  it('returns exactly { lastBatchAt, status } — no extra fields from old stub shape', async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000)
    mockBatchHealthFindFirst.mockResolvedValueOnce({ completed_at: recentDate })

    const agent = request.agent(app)
    await agent.post('/test/login').send({ userId: 1, districtId: SESSION_DISTRICT_ID })

    const res = await agent.get('/api/health')

    expect(res.status).toBe(200)
    // Old stub had: status: 'no_data', lastBatchStatus, messagesProcessed, signalsWritten, queueDepth
    expect(res.body.lastBatchStatus).toBeUndefined()
    expect(res.body.messagesProcessed).toBeUndefined()
    expect(res.body.signalsWritten).toBeUndefined()
    expect(res.body.queueDepth).toBeUndefined()
    expect(Object.keys(res.body).sort()).toEqual(['lastBatchAt', 'status'])
  })
})
