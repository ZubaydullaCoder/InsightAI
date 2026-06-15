// apps/server/src/health/index.ts
import { Router, type IRouter } from 'express'
import { prisma } from '../shared/db.js'
import { logger } from '../shared/logger.js'

export const healthRouter: IRouter = Router()


// TODO: Replace in Story 5.1 with full HealthStatus shape (bot connectivity, queue depth, etc.)
healthRouter.get('/health', async (req, res) => {
  try {
    const latest = await prisma.batchHealth.findFirst({
      where: {
        district_id: req.session.districtId,
        completed_at: { not: null },
      },
      orderBy: { completed_at: 'desc' },
      select: { completed_at: true },
    })

    const completedAt = latest?.completed_at ?? null
    const DELAY_THRESHOLD_MS = 25 * 60 * 1000 // 25 minutes

    const isDelayed =
      completedAt === null ||
      Date.now() - completedAt.getTime() >= DELAY_THRESHOLD_MS

    res.json({
      lastBatchAt: completedAt?.toISOString() ?? null,
      status: isDelayed ? 'delayed' : 'current',
    })
  } catch (err) {
    logger.error({ err }, 'Health endpoint query failed')
    res.status(500).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Health check failed',
    })
  }
})
