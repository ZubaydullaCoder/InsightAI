# Deferred Work

## Deferred from: code review of story 1-4 (2026-06-10)

- `textSnippet` truncation via `rawText.slice(0, 160)` may split a UTF-16 surrogate pair in emoji-heavy text — produces malformed character in `pipeline_events.detail`. Low risk for Uzbek/Cyrillic pilot.
- No caching on `getActiveKeywords()` — every incoming message triggers a `prisma.keyword.findMany()` DB query. At pilot volume this is acceptable, but at scale keywords should be cached with a short TTL.
- `rawMessage.upsert` non-duplicate constraint failure (e.g., FK violation, connection drop) is unhandled — pre-existing from Story 1.2, not introduced by Story 1.4.
- `update.message!.date` with value `0` from Telegram produces `new Date(0)` (1970-01-01) as `telegram_timestamp` — misleading but extremely rare edge case.
