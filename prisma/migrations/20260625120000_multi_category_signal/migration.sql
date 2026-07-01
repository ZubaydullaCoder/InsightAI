-- Migration: multi_category_signal
-- Change: Replace the standalone UNIQUE on telegram_update_id with a composite
--         UNIQUE on (telegram_update_id, category) so that a single Telegram
--         message can produce one signal_message row per service category.

-- Drop the old single-column unique index
DROP INDEX IF EXISTS "signal_messages_telegram_update_id_key";

-- Add the new composite unique constraint
ALTER TABLE "signal_messages"
  ADD CONSTRAINT "signal_messages_telegram_update_id_category_key"
  UNIQUE ("telegram_update_id", "category");
