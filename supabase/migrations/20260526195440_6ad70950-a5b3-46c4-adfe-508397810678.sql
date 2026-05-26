
UPDATE public.profiles p
SET whatsapp_number = '5515997198343'
FROM auth.users u
WHERE p.user_id = u.id AND u.email = 'guilhermecostaescultor@gmail.com';

UPDATE public.profiles p
SET whatsapp_number = '5511998530477'
FROM auth.users u
WHERE p.user_id = u.id AND u.email = 'automacoes@integralmidia.com.br';

-- Show result of mapping for verification (no-op SELECT will appear in logs)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.display_name, u.email, p.whatsapp_number
    FROM public.profiles p JOIN auth.users u ON u.id = p.user_id
  LOOP
    RAISE NOTICE 'profile: % | % | %', r.display_name, r.email, r.whatsapp_number;
  END LOOP;
END $$;
