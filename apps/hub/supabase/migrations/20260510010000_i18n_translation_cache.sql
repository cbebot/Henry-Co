-- Pass 18 runtime auto-translation cache.
--
-- Stores per-(source_text, source_locale, target_locale) translations so the
-- server-side translateText() helper pays for DeepL exactly once per string.
--
-- service_role only: RLS is on and there are no policies, so PostgREST cannot
-- read or write this table from anon/authenticated. Only server actions
-- using the service-role key (createAdminSupabase) touch it.
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS / DO blocks throughout.
--
-- Already applied to production 2026-05-09 via Supabase MCP
-- (apply_migration name=i18n_translation_cache).

CREATE TABLE IF NOT EXISTS public.i18n_translation_cache (
  source_text     TEXT        NOT NULL,
  source_locale   TEXT        NOT NULL DEFAULT 'en',
  target_locale   TEXT        NOT NULL,
  translated_text TEXT        NOT NULL,
  source          TEXT        NOT NULL DEFAULT 'deepl', -- 'deepl' | 'manual' | 'fallback'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_text, source_locale, target_locale)
);

CREATE INDEX IF NOT EXISTS i18n_translation_cache_target_locale_idx
  ON public.i18n_translation_cache (target_locale);

CREATE INDEX IF NOT EXISTS i18n_translation_cache_updated_at_idx
  ON public.i18n_translation_cache (updated_at DESC);

CREATE OR REPLACE FUNCTION public.i18n_translation_cache_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $tg$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'i18n_translation_cache_touch_updated_at'
  ) THEN
    CREATE TRIGGER i18n_translation_cache_touch_updated_at
      BEFORE UPDATE ON public.i18n_translation_cache
      FOR EACH ROW
      EXECUTE FUNCTION public.i18n_translation_cache_touch_updated_at();
  END IF;
END
$tg$;

ALTER TABLE public.i18n_translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.i18n_translation_cache FORCE  ROW LEVEL SECURITY;

REVOKE ALL ON public.i18n_translation_cache FROM anon;
REVOKE ALL ON public.i18n_translation_cache FROM authenticated;
GRANT  ALL ON public.i18n_translation_cache TO   service_role;

COMMENT ON TABLE public.i18n_translation_cache IS
  'Pass 18 runtime auto-translation cache. service_role only. Source text + (source_locale, target_locale) → translated text. Filled lazily by translateText() helper, pre-warmed by scripts/i18n-prewarm-cache.mjs.';
