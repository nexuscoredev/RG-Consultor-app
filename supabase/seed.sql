-- Metadados para usuários já criados no Supabase Auth (Authentication → Users).
-- Ajuste os IDs se necessário após criar os usuários.

-- Exemplo: atualizar metadata do vendedor (substitua o UUID pelo id do usuário no Auth)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role":"seller","display_name":"Consultor Demo","seller_id":"22222222-2222-2222-2222-222222222222","region":"SP"}'::jsonb
-- WHERE email = 'vendedor@rg.com';

-- Tabela opcional para perfis (futuro sync com API)
CREATE TABLE IF NOT EXISTS public.consultor_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'seller',
  seller_id text,
  region text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.consultor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.consultor_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.consultor_profiles FOR UPDATE
  USING (auth.uid() = id);
