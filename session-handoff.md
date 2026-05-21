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

Permanent decisions and artifacts live in the PRD, research docs, UX spec shards, architecture docs, stories, preference log, commits, and source files.

---

## Current Phase

- PRD: ✅ Complete (validated + patched 2026-05-18).
- Technical research: ✅ Corrected and directionally valid; unstable implementation details flagged for validation.
- Implementation readiness assessment: ✅ Ran 2026-05-17 — was **not ready** (UX/Arch/Epics missing at that time).
- UX Design: ✅ **Complete and sharded** — 14-step spec produced (2026-05-20), evaluated against mockup, 3 shards refactored with gap fixes (2026-05-21 afternoon).
- Architecture: ❌ Not started. **This is the confirmed next step.**
- Epics & Stories: ❌ Not started.
- App implementation: ❌ Not started.

---

## What Changed in This Session (2026-05-21 Afternoon)

### 1. UX Spec Sharded
- `_bmad-output/planning-artifacts/ux-design-specification.md` was sharded using `npx @kayvan/markdown-tree-parser explode`.
- Original monolith (65KB, 1,093 lines) deleted after sharding confirmed successful.
- **Output: 12 section files + index.md** in `_bmad-output/planning-artifacts/ux-design-specification/`.

### 2. UX Spec Evaluated Against Mockup
A dashboard mockup image was provided by the user. The spec was cross-checked against it. The following were confirmed correctly implemented in the mockup:
- Five-lane layout, sticky headers, count badges, category-colored left borders.
- Card anatomy (sender / mahalla / timestamp / text / tone badge).
- Amber delay banner (exact correct text).
- Context drawer with breadcrumb.
- Active card highlight.
- Warm off-white background palette.

The following issues were identified:

| Severity | Issue |
|---|---|
| 🔴 Critical | Latin/Cyrillic mixing across ~8 UI strings (time chips, search placeholder, drawer subtitle) |
| 🔴 Critical | `Барчасини кўриш (N) >` footer at bottom of each lane — contradicts virtual scroll spec |
| 🔴 Critical | Three-dot `⋮` action menus on drawer signal cards — contradicts passive monitoring principle |
| 🔴 Critical | `Барча алоқадор сигналларни кўриш` footer button in drawer — contradicts spec |
| 🟡 Medium | Missing `1 соат` time preset chip (spec requires 4 presets: 1h/3h/6h/Today) |
| 🟡 Medium | Unexplained green dot indicators on some lane cards — undefined visual affordance |
| 🟡 Medium | CaptionBadge label `Фото олинган` — wrong translation, wrong script |
| 🟡 Medium | `Танланган сигнал` label badge on drawer anchor card — over-communicates; highlight state is sufficient |

### 3. New Spec Gap Discovered and Resolved
- **Drawer temporal anchor behavior** was identified as unspecified in the original UX spec.
- User confirmed: the drawer should display all corroborating signals in ascending chronological order, with the clicked (anchor) signal vertically centered in the drawer body — signals before it appear above, signals after it appear below.

### 4. Three UX Spec Shards Refactored
All changes are spec-level only (no implementation code changed).

**`core-user-experience.md`:**
- Added explicit `time_range` definition: drawer uses the user's **currently active filter**, not a fixed window.
- Added full **Drawer Temporal Anchor Rule** section (ascending order, centered anchor, fetch strategy, empty drawer state).

**`component-strategy.md`:**
- Added **no lane pagination footer** rule (`Барчасини кўриш` banned by name).
- Fixed `CaptionBadge` `aria-label` to `Расм тавсифи` (Cyrillic).
- Added **no unspecified status indicators** rule (green dots, colored circles explicitly prohibited).
- Added new **Drawer Card Rules** section: no action menus, no pagination footer, no "selected" label badge, full text in drawer (no 3-line clamp inside drawer).

**`ux-consistency-patterns.md`:**
- Added drawer pattern table rows: signal ordering (ascending), temporal anchor (centered), anchor highlight (highlight only, no badge).
- Updated filter table: `1 соат` preset added (was missing); all preset labels now Cyrillic.
- Added preset chip Cyrillic reference table (correct vs. ~~wrong Latin~~ side-by-side).
- Added Cyrillic string enforcement table with 5 concrete mandatory corrections.
- Added hard rule: Latin Uzbek strings = build errors, not style preferences.

---

## Stable Decisions to Carry Forward

- Architecture direction: modular monolith.
- Language: TypeScript.
- Bot: grammY + Telegram webhooks.
- Backend: Fastify with strict modules.
- Frontend: React + Vite SPA, React Router, TanStack Query.
- Component library: **Ant Design v5**.
- Font: **Inter** (Cyrillic subset via Google Fonts).
- Database: PostgreSQL.
- Queue/worker: Redis + BullMQ.
- ORM default: Drizzle.
- Runtime validation: Zod.
- Auth: session-based cookies, not JWT.
- Deployment: single VPS + Docker Compose + Nginx + Let's Encrypt.
- Runtime topology: one repo, separate `web` and `worker` processes/containers.
- `hokim_related` is a boolean flag, never a category enum value.
- MVP scope is fixed; no new features until pilot proves the concept.
- Accessibility target: **WCAG 2.1 Level AA**.
- Git workflow: feature branch → PR → review → merge. No direct pushes to `main`.

---

## Key UX Design Decisions (for Architecture and Implementation)

- **Visual direction: Direction A — Compact Scan.** 3-line text clamp (lane cards only; full text in drawer), 7px card gap, 56px filter bar, `#FFFFFF` filter bar background.
- **5 lane categories (Uzbek Cyrillic):** Ҳокимга тегишли, Сув, Электр, Газ, Чиқинди. Each has a semantic color token (left-border accent).
- **Category colors:** Ҳокимга тегишли `#7C2D56`, Сув `#1D6FA4`, Электр `#B45309`, Газ `#1A7060`, Чиқинди `#5C6B2E`.
- **Sender display policy:** Telegram Display Name → `@username` → *Резидент*.
- **Context drawer:** 250ms slide-in overlay (380px at ≥1440px / 340px at 1024–1279px), no lane reflow. Breadcrumb updates instantly on card swap; body shows skeleton shimmer then content.
- **Drawer temporal anchor:** Signals rendered ascending chronological order. Anchor signal vertically centered in drawer body on open. Signals before = above; signals after = below. No "selected" badge — highlight state only.
- **Drawer `time_range`:** Uses the user's currently active filter, not a fixed window.
- **Drawer card constraints:** No action menus, no pagination footer, full text (no 3-line clamp).
- **Lane constraint:** No pagination footer. Continuous virtual scroll.
- **Client-side operations** (mahalla filter, keyword search, preset time slices) must be instant (<300ms) — never show skeleton shimmer.
- **Custom components:** `<LaneGrid>` (5-column virtual scroll) and `<SignalCard>` (pure presentational). All others from AntD v5.
- **All UI copy is Uzbek Cyrillic. No Latin Uzbek. Latin strings = build errors.**
- **Time preset chips (Cyrillic mandatory):** `1 соат`, `3 соат`, `6 соат`, `Бугун`, `Кеча`, `7 кун`.
- **Responsive:** Desktop-only. Hard block at `<1024px`. Breakpoints at 1279px (condensed) and 1440px (expanded).
- **No modal dialogs, no toast notifications, no `confirm()` in MVP.**

---

## Provisional / Must Validate Before Implementation

- Exact AI model/provider, current pricing, latency, SDK syntax, and structured output support.
- Uzbek/Russian mixed-message classifier quality using a 100–200 message benchmark.
- Telegram test group behavior: privacy mode/admin requirements, captions, forwarded messages, edited messages, anonymous admins, and bot removal events.
- Exact BullMQ scheduler API/version.
- Conservative pre-filter thresholds, especially short civic texts (`gaz?`, `suv?`, `tok?`, `svet?`).
- Caption text (`message.caption`) — confirmed in-scope for MVP intake per updated PRD FR17.

---

## Recently Changed Files

- `_bmad-output/planning-artifacts/ux-design-specification/` (directory) — created by sharding; contains 12 section shards + `index.md`.
- `_bmad-output/planning-artifacts/ux-design-specification.md` — **deleted** (replaced by shards).
- `_bmad-output/planning-artifacts/ux-design-specification/core-user-experience.md` — refactored: `time_range` definition + Drawer Temporal Anchor Rule added.
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md` — refactored: no lane pagination footer, no unspecified indicators, CaptionBadge fix, Drawer Card Rules section added.
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` — refactored: drawer ordering rows, `1 соат` preset, Cyrillic chip labels table, Cyrillic string enforcement table.
- `user-client-preferences-log.md` — updated with new entries from this session.
- `session-handoff.md` — this file; rewritten.

---

## Important Reminder for Next AI Agent

Do not treat this file as a full project source of truth. Use it only as quick orientation, then inspect the relevant repo files before making decisions or edits.

The UX spec is now sharded — start from `_bmad-output/planning-artifacts/ux-design-specification/index.md` to navigate it. Do not look for `ux-design-specification.md` — it no longer exists.
