# Drop Água

Sistema de gestão de entregas/retiradas de água — clientes, motoristas, placas, vales e relatórios.
Reescrita do Trans-Água: Vite + React no Vercel, Supabase (Postgres + Auth + Row Level Security) no lugar de um backend próprio.

## Setup local

1. Crie um projeto no [supabase.com](https://supabase.com) (free tier).
2. No SQL Editor do projeto, rode o conteúdo de `supabase/migrations/0001_init.sql`.
3. Em Authentication → Add user, crie o primeiro usuário (e-mail/senha). Depois, no SQL Editor:
   ```sql
   update public.profiles set is_admin = true where id = '<uuid do usuário criado>';
   ```
4. Copie `.env.example` para `.env.local` e preencha com a Project URL e a anon key (Settings → API).
5. `npm install && npm run dev`

## Deploy (Vercel)

1. Conecte o repositório no Vercel.
2. Configure as variáveis de ambiente do projeto: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (mesmos valores do `.env.local`).
3. Build command padrão (`npm run build`), output `dist/` — já detectado automaticamente pelo preset Vite do Vercel. `vercel.json` cuida do rewrite de rotas para SPA.

## Estrutura

- `src/lib/supabaseClient.ts` — cliente único do Supabase.
- `src/auth/` — contexto de autenticação (sessão + perfil/`is_admin`) e rota protegida.
- `src/services/` — uma função por tabela (list/search/create/update/delete via Supabase).
- `src/pages/` — uma pasta por tela.
- `supabase/migrations/` — schema, RLS e triggers versionados.
- `scripts/` — scripts avulsos (ex.: importação de dados do Trans-Água), não fazem parte do build do app.
