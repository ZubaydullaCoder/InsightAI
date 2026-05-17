# Previous Chat Session Context

> **Purpose:** This file is updated at the end of each working session. It gives the AI assistant in the next session immediate, accurate context about current project state — what was done and what was decided. Read this before starting any new work on Mahalla Ovozi.

---

## Session: 2026-05-17

### What Was Accomplished

#### 1. Technical Research Validation Patch Applied
File: `_bmad-output/planning-artifacts/research/technical-telegram-ai-pipeline-research-2026-05-13.md`

The technical research was reviewed for correctness and overconfidence. It remains directionally useful, but several claims were corrected from “final/verified” to “must validate during Architecture/Implementation.”

Key corrections:

- **AI model choice softened:** Gemini-family fast/low-cost models remain the leading candidate, but **Gemini 2.5 Flash is no longer frozen as the final model**. Exact model must be chosen after checking current pricing, SDK support, latency, and Uzbek benchmark results.
- **Pricing softened:** Exact AI cost estimates are no longer treated as stable. Recalculate from current official pricing and measured token usage before implementation.
- **Pre-filter risk corrected:** Removed “zero false-negative risk” language. Short civic messages like `gaz?`, `suv?`, `tok?`, and `свет?` must not be dropped by a naive `<5 chars` rule.
- **Telegram setup marked for real test:** Privacy mode/admin behavior, captions, forwarded messages, anonymous admins, edited messages, and bot removal events must be tested in a real Telegram test group.
- **BullMQ/API syntax marked for verification:** Use BullMQ for scheduling, but confirm exact current API/version during architecture/package selection.
- **Structured output marked for verification:** Continue preferring `@google/genai`, but verify current TypeScript syntax for `responseSchema`, `responseMimeType`, and `thinkingConfig`.

#### 2. PRD Consistency Patch Applied
File: `_bmad-output/planning-artifacts/prd.md`

The PRD remains complete and product scope remains unchanged. It was lightly patched to remove unstable implementation claims:

- Removed hard Gemini 2.5 Flash commitment.
- Replaced exact AI cost claims with implementation-time revalidation language.
- Replaced strong pre-filter impact claims with conservative centralized pre-filter wording.
- Clarified `hokim_related` remains a boolean cross-cutting flag, not a category.
- Added implementation validation notes for AI model, Telegram behavior, classifier benchmark, and pre-filter tests.

#### 3. User/Client Preferences Log Updated
File: `user-client-preferences-log.md`

Updated to reflect:

- AI model is provisional until implementation validation.
- `@google/genai` remains preferred, but syntax must be verified against current docs/types.
- Non-thinking/low-latency classifier mode remains preferred only where supported cleanly.
- Pre-filter thresholds are provisional until real-data validation.
- Bot sender filter remains mandatory but should be counted/logged.
- Pilot cost target remains low, but exact AI cost must be recalculated.

#### 4. Refined MVP Tooling Defaults Recorded
File: `user-client-preferences-log.md`

Tooling preferences added for the architecture phase:

- **Frontend:** prefer React + Vite SPA with React Router and TanStack Query. Next.js only if Architecture identifies a concrete benefit.
- **ORM:** prefer Drizzle unless Prisma is intentionally chosen for beginner productivity.
- **Runtime validation:** use Zod for env/config, API validation, Telegram-derived payload normalization, and AI output validation.
- **Runtime topology:** keep one modular TypeScript monolith repo, but deploy separate runtime entrypoints/processes: `web` and `worker`.
- **Backend structure:** Fastify is acceptable only with strict module boundaries (`auth`, `bot`, `classifier`, `signals`, `health`, `shared`) to avoid route-handler sprawl.

---

## Session: 2026-05-16

### What Was Accomplished

#### 1. Technical Research — Initial SDK and Pricing Corrections Applied
File: `_bmad-output/planning-artifacts/research/technical-telegram-ai-pipeline-research-2026-05-13.md`

Earlier corrections applied:
- **SDK migration:** `@google/generative-ai` → `@google/genai`
- **Pricing correction:** Gemini 2.5 Flash was estimated as more expensive than GPT-4o-mini at the time
- **BullMQ syntax:** `repeat` + `cron` → `upsertJobScheduler` recommendation

These are now superseded by the 2026-05-17 validation stance: keep the direction, but revalidate current details before implementation.

#### 2. PRD — Fully Completed (12-step bmad-create-prd workflow)
File: `_bmad-output/planning-artifacts/prd.md`

All 12 workflow steps completed. Final document contains:

| Section | Key Decisions |
|---|---|
| **Executive Summary** | Signal legibility for leadership; not a complaint portal; 20-min batch; pre-filtering before AI as an implementation strategy |
| **Project Classification** | GovTech, High Complexity, Greenfield, Private Internal Tool |
| **Success Criteria** | Behavioral (hokim trusts the lanes); AI accuracy targets directional until pilot data exists; 2–4 week pilot review |
| **Product Scope** | Single MVP release; no additions until pilot proven; Growth/Vision deferred entirely |
| **User Journeys** | 4 journeys: hokimi signal scan, mahalla investigation, staff monitoring, operator health check |
| **Domain Requirements** | Hokim owns all policy (data law, sender display, residency); developer owns security/retention/auth only |
| **Web App Requirements** | SPA (React/Next.js), desktop-only (1366×768 min), light mode, no SSE/WebSocket, 60s poll |
| **Project Scoping** | Single release; all 12 must-have capabilities listed; no nice-to-have deferrals |
| **Functional Requirements** | FR1–FR34 across 8 capability areas (Signal Display, Context Drawer, Filtering, Intake, AI Pipeline, Storage, Auth, Health) |
| **Non-Functional Requirements** | NFR1–15: performance targets, security controls, reliability guarantees, pilot-scale scalability |

#### 3. Key Clarifications Locked During PRD

- **“Morning briefing” framing rejected:** The dashboard is on-demand, time-agnostic. Never assume usage is tied to a specific time or schedule.
- **No AI accuracy hard targets in MVP:** Hard thresholds will be set only after real-group pilot/labeled data. PRD records directional targets only.
- **No vanity metrics in success criteria:** Success is behavioral: hokim can reliably scan signals faster than reading raw chats.
- **Scope discipline:** MVP is exactly `project-raw-idea.md §6`. No additions regardless of how “small” they seem. Prove the concept first.

---

## Current Project State

| Artifact | Status |
|---|---|
| `project-raw-idea.md` | ✅ Source document — do not modify |
| Technical Research | ✅ Corrected 2026-05-17; direction valid, unstable implementation details flagged for validation |
| Domain Research | ✅ Complete |
| User-Client Preferences Log | ✅ Updated 2026-05-17 with refined tooling defaults |
| PRD | ✅ Complete; lightly patched after research validation |
| UX Design | ❌ Not started |
| Architecture Document | ❌ Not started |
| Epics & Stories | ❌ Not started |
| App Implementation | ❌ Not started / no confirmed app code |

---

## Current Technical Decisions

> Stable means safe to carry into architecture. Provisional means architecture must validate before freezing.

| Decision | Current Status |
|---|---|
| Architecture | Stable: Modular Monolith |
| Language | Stable: TypeScript |
| Bot framework | Stable direction: grammY (Node.js/TypeScript) + webhooks |
| Queue | Stable direction: Redis + BullMQ; exact scheduler API/version must be verified |
| AI Classifier | Provisional: Gemini-family fast/low-cost model preferred, exact model TBD after current pricing + Uzbek benchmark |
| Gemini SDK | Stable preference: `@google/genai`; exact syntax must be verified against current docs/types |
| Database | Stable: PostgreSQL |
| ORM | Default preference: Drizzle; Prisma acceptable only if chosen intentionally |
| Backend API | Stable: Fastify, with strict module boundaries |
| Runtime validation | Stable preference: Zod |
| Frontend | Default preference: React + Vite SPA, React Router, TanStack Query; no Next.js unless justified |
| Auth | Stable: Session-based, not JWT |
| Infra | Stable direction: Single VPS + Docker Compose + Nginx + Let's Encrypt |
| Runtime topology | Stable direction: one repo, separate `web` and `worker` runtime entrypoints/processes |
| Batch strategy | Stable: synchronous classifier calls in 20-min scheduled worker; exact provider/model TBD |
| Pre-filter stack | Stable concept, provisional thresholds: centralized F1/F2/F3 filters; avoid aggressive short-text discard until tested |
| `hokim_related` | Stable: Boolean flag only, never category enum |
| Signal retention | Stable product decision: 90 days |
| Raw message retention | Stable product decision: delete after successful classification; optional controlled debug strategy may be designed for tuning |
| Pilot monthly cost | Provisional: target remains low, exact AI cost must be recalculated |
| Display target | Stable: desktop/large monitor; no mobile MVP |
| Browser support | Stable: latest Chrome, Firefox, Edge |

---

## Immediate Next Steps

Recommended order from here:

1. **Run `bmad-check-implementation-readiness`** against the corrected PRD/research context.
2. **Run `bmad-create-ux-design`** for dashboard interaction patterns and component specs.
3. **Run `bmad-create-architecture`** with explicit validation tasks for:
   - current AI model/pricing/SDK syntax
   - Telegram test group setup
   - centralized pre-filter pipeline
   - short civic text handling
   - classifier benchmark plan
   - React + Vite SPA default
   - Drizzle vs Prisma decision
   - Zod validation strategy
   - separate `web` and `worker` runtime entrypoints
4. **Run `bmad-create-epics-and-stories`** after architecture/UX decisions are stable.

---

_Last updated: 2026-05-17_
