-- Wipe all application data
TRUNCATE TABLE public.webhook_logs CASCADE;
TRUNCATE TABLE public.webhooks CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.api_keys CASCADE;
TRUNCATE TABLE public.user_credits CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Delete all auth users
DELETE FROM auth.users;