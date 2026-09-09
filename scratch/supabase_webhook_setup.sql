-- ==============================================================================
-- SAMPLESWALA: SUPABASE DATABASE ON-DEMAND REVALIDATION TRIGGERS
-- ==============================================================================
-- This SQL script sets up pg_net database triggers on Supabase so that whenever
-- records are inserted, updated, or deleted in critical tables, an instant webhook
-- ping is dispatched to the Next.js /api/revalidate endpoint.
--
-- Supported Tables:
-- 1. sample_packs
-- 2. samples
-- 3. presets
-- 4. user_vault (purchases)
-- 5. user_accounts (signups & users)
-- 6. support_tickets
-- 7. artist_payout_settings
-- 8. coupons
-- 9. app_metadata (banner / launch offer / flash sale settings)
-- 10. software_orders
-- ==============================================================================

-- 1. Webhook Dispatch Function using pg_net
CREATE OR REPLACE FUNCTION notify_revalidation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    webhook_payload jsonb;
BEGIN
    webhook_payload := json_build_object(
        'table', TG_TABLE_NAME,
        'type', TG_OP,
        'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
        'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )::jsonb;

    -- A. Ping Main Website (SamplesWala2)
    PERFORM net.http_post(
        url := 'https://sampleswala.com/api/revalidate',
        body := webhook_payload,
        headers := '{"Content-Type": "application/json", "x-revalidation-token": "sampleswala_cache_bypass_token_2026"}'::jsonb,
        timeout_milliseconds := 5000
    );

    -- B. Ping Admin Dashboard (SamplesWalaAdmin)
    -- If your admin is hosted on admin.sampleswala.com, update the URL below accordingly:
    -- PERFORM net.http_post(
    --     url := 'https://admin.sampleswala.com/api/revalidate',
    --     body := webhook_payload,
    --     headers := '{"Content-Type": "application/json", "x-revalidation-token": "sampleswala_cache_bypass_token_2026"}'::jsonb,
    --     timeout_milliseconds := 5000
    -- );

    RETURN NULL;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'notify_revalidation failed: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- 2. Create or Replace Triggers for All Key Tables

-- A. Sample Packs
DROP TRIGGER IF EXISTS tr_revalidate_sample_packs ON public.sample_packs;
CREATE TRIGGER tr_revalidate_sample_packs
AFTER INSERT OR UPDATE OR DELETE ON public.sample_packs
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- B. Samples
DROP TRIGGER IF EXISTS tr_revalidate_samples ON public.samples;
CREATE TRIGGER tr_revalidate_samples
AFTER INSERT OR UPDATE OR DELETE ON public.samples
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- C. Presets
DROP TRIGGER IF EXISTS tr_revalidate_presets ON public.presets;
CREATE TRIGGER tr_revalidate_presets
AFTER INSERT OR UPDATE OR DELETE ON public.presets
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- D. User Vault (Orders & Pack purchases)
DROP TRIGGER IF EXISTS tr_revalidate_user_vault ON public.user_vault;
CREATE TRIGGER tr_revalidate_user_vault
AFTER INSERT OR UPDATE OR DELETE ON public.user_vault
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- E. User Accounts
DROP TRIGGER IF EXISTS tr_revalidate_user_accounts ON public.user_accounts;
CREATE TRIGGER tr_revalidate_user_accounts
AFTER INSERT OR UPDATE OR DELETE ON public.user_accounts
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- F. Support Tickets
DROP TRIGGER IF EXISTS tr_revalidate_support_tickets ON public.support_tickets;
CREATE TRIGGER tr_revalidate_support_tickets
AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- G. Coupons
DROP TRIGGER IF EXISTS tr_revalidate_coupons ON public.coupons;
CREATE TRIGGER tr_revalidate_coupons
AFTER INSERT OR UPDATE OR DELETE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- H. Artist KYC Settings
DROP TRIGGER IF EXISTS tr_revalidate_artist_payout_settings ON public.artist_payout_settings;
CREATE TRIGGER tr_revalidate_artist_payout_settings
AFTER INSERT OR UPDATE OR DELETE ON public.artist_payout_settings
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- I. App Metadata (Launch offer / Flash sale toggles)
DROP TRIGGER IF EXISTS tr_revalidate_app_metadata ON public.app_metadata;
CREATE TRIGGER tr_revalidate_app_metadata
AFTER INSERT OR UPDATE OR DELETE ON public.app_metadata
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();

-- J. Software Orders
DROP TRIGGER IF EXISTS tr_revalidate_software_orders ON public.software_orders;
CREATE TRIGGER tr_revalidate_software_orders
AFTER INSERT OR UPDATE OR DELETE ON public.software_orders
FOR EACH ROW EXECUTE FUNCTION notify_revalidation();
