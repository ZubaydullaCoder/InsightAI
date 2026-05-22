# Session Handoff — Mahalla Ovozi

_Last updated: 2026-05-22_

## Purpose

This file is updated only when explicitly requested by the user at the end of a chat session. It provides a compact, factual handoff for the next AI chat session.

Rules:

- Overwrite this file completely when updating it.
- Do not append old session history.
- Keep only completed discussions, confirmed decisions, actual implementation details, changed files, current project state, and concrete facts discovered during the session.
- Do not include future implementation plans, next-step recommendations, roadmap suggestions, speculative improvements, or unimplemented ideas.
- Do not duplicate full PRD, architecture, research, stories, commits, or source code details.
- Treat this as temporary session continuity, not as the permanent source of truth.

Permanent decisions and artifacts live in the PRD, research docs, UX spec shards, architecture docs, stories, preference log, commits, and source files.

---

## Current Phase

- PRD: complete.
- Technical research: corrected and directionally valid; unstable implementation details flagged for validation.
- Implementation readiness assessment: complete; previous result was not ready because UX, Architecture, and Epics/Stories were missing.
- UX Design: complete and sharded; cleanup patches applied on 2026-05-22.
- Architecture: not started.
- Epics & Stories: not started.
- App implementation: not started.

---

## What Changed in This Session

All changes are spec/documentation-level only. No app implementation code was created.

### UX cleanup patches applied

- `core-user-experience.md`
  - Corrected Hokim-related drawer behavior.
  - The Hokim-related lane is only a priority entry point.
  - Drawer context now always uses the clicked signal's original service category plus mahalla/group scope plus active time range.
  - Explicitly forbids filtering drawer context only to `hokim_related=true` signals.
  - Added Architecture note to decide exact drawer query scope: `mahalla_id` vs `telegram_chat_id`.
  - Renamed the primary success moment from briefing wording to signal-scan wording.

- `component-strategy.md`
  - Fixed Gas color token examples to Gas teal `#1A7060`.
  - Clarified that Hokim-lane cards still use the original service category color.
  - Added explicit note that Hokim-lane card clicks open the same category-based drawer as any other lane.

- `user-journey-flows.md`
  - Renamed Journey 1 to “On-Demand Signal Scan.”
  - Removed start-of-day assumption.
  - Changed completion wording to “signal understanding formed.”
  - Changed Mahalla dropdown from “listed with signal counts” to “listed by name.”
  - Marked dropdown signal counts as optional post-pilot polish, not MVP scope.

- `responsive-design-accessibility.md`
  - Clarified WCAG 2.1 AA as an internal MVP quality target, not a formal external pilot audit requirement.
  - Clarified accepted MVP limitations.
  - Resolved drawer accessibility contradiction by choosing AntD Drawer default dialog/focus behavior for MVP.

- `ux-consistency-patterns.md`
  - Added Architecture handoff for UI string enforcement.
  - Requires a typed UI string dictionary/module and lightweight Latin Uzbek slip-through test/lint check.
  - Clarifies that enforcement must not block raw resident text, Telegram sender names, logs, test fixtures, or classifier examples.

- `design-direction-decision.md`
  - Fixed relative link to `ux-design-directions.html`.
  - Marked the HTML prototype as static reference only, not implementation source of truth.
  - Clarified that the sharded UX spec is the source of truth.
  - Reworded compact-density rationale to avoid morning-only usage framing.

- `user-client-preferences-log.md`
  - Added confirmed product decisions for corrected Hokim-related drawer behavior, MVP dropdown count scope, and WCAG AA scope boundary.
  - Added architectural preferences for drawer scope validation and UI string enforcement.

---

## Stable Decisions to Carry Forward

- Architecture direction: modular monolith.
- Language: TypeScript.
- Bot: grammY + Telegram webhooks.
- Backend: Fastify with strict modules.
- Frontend: React + Vite SPA, React Router, TanStack Query.
- Component library: Ant Design v5.
- Font: Inter with Cyrillic subset.
- Database: PostgreSQL.
- Queue/worker: Redis + BullMQ.
- ORM default: Drizzle.
- Runtime validation: Zod.
- Auth: session-based cookies, not JWT.
- Deployment: single VPS + Docker Compose + Nginx + Let's Encrypt.
- Runtime topology: one repo, separate `web` and `worker` processes/containers.
- `hokim_related` is a boolean flag, never a category enum value.
- MVP scope is fixed; no new features until pilot proves the concept.
- Accessibility target: WCAG 2.1 AA internal MVP quality target.
- Git workflow: feature branch → PR → review → merge. No direct pushes to `main`.

---

## Key UX Decisions

- Visual direction: Direction A — Compact Scan.
- Category colors: Hokim `#7C2D56`, Suv `#1D6FA4`, Elektr `#B45309`, Gaz `#1A7060`, Chiqindi `#5C6B2E`.
- Sender display policy: Telegram Display Name → `@username` → `Резидент`.
- Context drawer: overlay drawer; no lane reflow; breadcrumb updates on card swap; body skeleton while loading.
- Hokim-related drawer rule: the lane is only a priority entry point. Drawer context uses the clicked signal's original service category plus mahalla/group scope plus active time range. It does not filter drawer context to only `hokim_related=true` signals.
- Drawer temporal anchor: ascending chronological order; anchor centered; no selected badge.
- Drawer cards: no action menus, no pagination footer, full text.
- Lane: no pagination footer; continuous virtual scroll.
- Mahalla dropdown: name selection only for MVP; counts are post-pilot polish.
- UI copy: Uzbek Cyrillic for production dashboard strings.
- Time chips: `1 соат`, `3 соат`, `6 соат`, `Бугун`, `Кеча`, `7 кун`.
- Responsive: desktop-only; hard block below `1024px`.
- Prototype status: `ux-design-directions.html` is static reference only; sharded UX spec is source of truth.

---

## Provisional / Must Validate Before Implementation

- Exact AI model/provider, current pricing, latency, SDK syntax, and structured output support.
- Uzbek/Russian mixed-message classifier quality using a 100–200 message benchmark.
- Telegram test group behavior: privacy mode/admin requirements, captions, forwarded messages, edited messages, anonymous admins, and bot removal events.
- Exact BullMQ scheduler API/version.
- Conservative pre-filter thresholds, especially short civic texts.
- Exact drawer query scope: `mahalla_id` vs `telegram_chat_id` if one mahalla can have multiple monitored Telegram groups.
- UI string enforcement mechanism: typed dictionary/module plus lightweight Cyrillic slip-through test/lint check.

---

## Recently Changed Files

- `_bmad-output/planning-artifacts/ux-design-specification/core-user-experience.md`
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`
- `_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md`
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`
- `_bmad-output/planning-artifacts/ux-design-specification/design-direction-decision.md`
- `user-client-preferences-log.md`
- `session-handoff.md`

---

## Important Reminder for Next AI Agent

Do not treat this file as a full project source of truth. Use it only as quick orientation, then inspect the relevant repo files before making decisions or edits.

The UX spec is sharded — start from `_bmad-output/planning-artifacts/ux-design-specification/index.md` to navigate it.
