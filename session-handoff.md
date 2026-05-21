# Session Handoff — Mahalla Ovozi

_Last updated: 2026-05-21_

## Purpose

This file is updated only when explicitly requested by the user at the end of a chat session. It provides a compact, factual handoff for the next AI chat session.

Rules:

- Overwrite this file completely when updating it.
- Do not append old session history.
- Keep only completed discussions, confirmed decisions, actual implementation details, changed files, current project state, and concrete facts discovered during the session.
- Do not include future implementation plans, next-step recommendations, roadmap suggestions, speculative improvements, or unimplemented ideas.
- Do not duplicate full PRD, architecture, research, stories, commits, or source code details.
- Treat this as temporary session continuity, not as the permanent source of truth.

Permanent decisions and artifacts live in the PRD, research docs, architecture docs, stories, preference log, commits, and source files.

---

## Current Phase

- PRD is complete and lightly patched after technical research validation.
- Technical research is corrected and directionally valid, but unstable implementation details are flagged for validation.
- Implementation readiness assessment is complete and says the project was **not ready for Phase 4 implementation** (as of 2026-05-17).
- **UX Design is now complete** — full 14-step specification produced and saved.
- Architecture has not started.
- Epics & Stories have not started.
- App implementation has not started / no confirmed app code exists.

---

## What Changed in the Previous Session (2026-05-20 – 2026-05-21)

- The full `bmad-create-ux-design` workflow was completed (Steps 1–14).
- `_bmad-output/planning-artifacts/ux-design-specification.md` — created from scratch, 1,050+ lines, all 14 steps completed. Contains: project understanding, emotional goals, pattern analysis, design system choice, visual foundation, design direction decision, user journey flows (3 Mermaid diagrams), component strategy, UX consistency patterns, responsive strategy, WCAG accessibility spec.
- `_bmad-output/planning-artifacts/ux-design-directions.html` — created. Interactive HTML prototype showcasing 3 design directions (A/B/C) with functioning drawer, tone badges, delay banner, Uzbek Cyrillic content. Direction A (Compact Scan) was confirmed as the chosen direction.
- `user-client-preferences-log.md` — updated with 4 new durable decisions from this session (see below).
- `session-handoff.md` — this file, updated.
- All new files were committed on branch `feat/ux-design-spec` (feature branch, not yet merged to main).

---

## Stable Decisions to Carry Forward

- Architecture direction: modular monolith.
- Language: TypeScript.
- Bot: grammY + Telegram webhooks.
- Backend: Fastify with strict modules.
- Frontend: React + Vite SPA, React Router, TanStack Query.
- **Component library: Ant Design v5** — confirmed in UX design session.
- **Font: Inter** — confirmed in UX design session (Cyrillic subset).
- Database: PostgreSQL.
- Queue/worker: Redis + BullMQ.
- ORM default: Drizzle.
- Runtime validation: Zod.
- Auth: session-based cookies, not JWT.
- Deployment direction: single VPS + Docker Compose + Nginx + Let's Encrypt.
- Runtime topology: one repo, separate `web` and `worker` processes/containers.
- `hokim_related` is a boolean flag, never a category enum value.
- MVP scope is fixed; no new features until pilot proves the concept.
- **Accessibility target: WCAG 2.1 Level AA** — confirmed in UX design session.
- **Git workflow: feature branch → PR → review → merge** — no direct pushes to `main`.

---

## Key UX Design Decisions (for Architecture and Implementation)

- **Visual direction: Direction A — Compact Scan.** 3-line text clamp, 7px card gap, 56px filter bar, `#FFFFFF` filter bar background.
- **5 lane categories (Uzbek Cyrillic short nouns):** Ҳокимга тегишли, Сув, Электр, Газ, Чиқинди. Each has a dedicated semantic color (left-border accent on cards).
- **Sender display policy:** Telegram Display Name → `@username` → *Резидент*.
- **Context drawer:** 250ms slide-in from right, fixed-width overlay (380px at ≥1440px / 340px at 1024–1279px), no lane reflow. Header breadcrumb updates instantly on card swap; body shows skeleton shimmer then content.
- **Client-side operations (mahalla filter, keyword search, preset time slices) must be instant (<300ms) — never show skeleton shimmer.**
- **Custom components needed:** `<LaneGrid>` (5-column virtual scroll layout) and `<SignalCard>` (pure presentational, all states). All others come from AntD v5.
- **All UI copy is Uzbek Cyrillic. No Latin Uzbek. No generic English fallback strings in UI.**
- **Responsive:** Desktop-only. Hard block at `<1024px`. Single functional breakpoint at 1279px (condensed) and 1440px (expanded).
- **No modal dialogs, no toast notifications, no `confirm()` in MVP.** All state changes via persistent visual states only.

---

## Provisional / Must Validate Before Implementation

- Exact AI model/provider, current pricing, latency, SDK syntax, and structured output support.
- Uzbek/Russian mixed-message classifier quality using a 100–200 message benchmark.
- Telegram test group behavior: privacy mode/admin requirements, captions, forwarded messages, edited messages, anonymous admins, and bot removal events.
- Exact BullMQ scheduler API/version.
- Conservative pre-filter thresholds, especially short civic texts such as `gaz?`, `suv?`, `tok?`, `svet?`.
- Whether text captions should be included in MVP intake despite text-only scope.

---

## Recently Changed Files

- `_bmad-output/planning-artifacts/ux-design-specification.md` — created; full 14-step UX design spec; ~1,050 lines.
- `_bmad-output/planning-artifacts/ux-design-directions.html` — created; interactive design direction showcase (3 directions, functional drawer).
- `user-client-preferences-log.md` — added: AntD v5 choice, Inter font choice, WCAG AA target, feature-branch PR workflow preference.
- `session-handoff.md` — this file; updated after UX design session.

---

## Important Reminder for Next AI Agent

Do not treat this file as a full project source of truth. Use it only as quick orientation, then inspect the relevant repo files before making decisions or edits.
