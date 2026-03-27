-- =====================================================
-- ZHomes Test Users Seed (Corrected)
-- Cleans up bad seeded entries and creates fresh users
-- =====================================================

-- Clean up any badly-seeded test users first
DELETE FROM auth.identities WHERE provider_id IN ('agente@zhomes.com', 'cliente@zhomes.com', 'broker@zhomes.com');
DELETE FROM auth.users WHERE id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
);

-- Create Agent user using Supabase's auth.create_user function (if available)
-- Otherwise inserts properly with all required fields for newer Supabase schema
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    role,
    aud,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_current,
    email_change_token_new,
    is_sso_user,
    is_anonymous,
    banned_until
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'agente@zhomes.com',
    crypt('Zhomes123!', gen_salt('bf')),
    now(),
    '{"full_name":"Miriam Castaño","role":"agent"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', '',
    false, false, null
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'cliente@zhomes.com',
    crypt('Zhomes123!', gen_salt('bf')),
    now(),
    '{"full_name":"Carlos Rivera","role":"buyer"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', '',
    false, false, null
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'broker@zhomes.com',
    crypt('Zhomes123!', gen_salt('bf')),
    now(),
    '{"full_name":"Roberto Méndez","role":"broker"}'::jsonb,
    '{"provider":"email","providers":["email"]}'::jsonb,
    'authenticated',
    'authenticated',
    now(),
    now(),
    '', '', '', '',
    false, false, null
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data;

-- Create identity records  
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at,
    last_sign_in_at
) VALUES
(
    '10000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"agente@zhomes.com","email_verified":true}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000001',
    now(), now(), now()
),
(
    '10000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"cliente@zhomes.com","email_verified":true}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000002',
    now(), now(), now()
),
(
    '10000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000003',
    '{"sub":"00000000-0000-0000-0000-000000000003","email":"broker@zhomes.com","email_verified":true}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000003',
    now(), now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Seed realtor availability (Mon-Fri)
INSERT INTO realtor_availability (realtor_id, day_of_week, start_time, end_time)
VALUES
    ('00000000-0000-0000-0000-000000000001', 1, '09:00', '17:00'),
    ('00000000-0000-0000-0000-000000000001', 2, '09:00', '17:00'),
    ('00000000-0000-0000-0000-000000000001', 3, '09:00', '17:00'),
    ('00000000-0000-0000-0000-000000000001', 4, '09:00', '17:00'),
    ('00000000-0000-0000-0000-000000000001', 5, '09:00', '15:00')
ON CONFLICT (realtor_id, day_of_week) DO NOTHING;
