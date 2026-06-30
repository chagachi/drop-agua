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

## CI

`.github/workflows/ci.yml` roda typecheck, testes (`npm test`) e build a cada push/PR na `master`. Não precisa de nenhuma variável de ambiente — o build funciona mesmo sem Supabase configurado (mostra a tela de "Configuração pendente").

## Backup automático do banco

`.github/workflows/backup.yml` roda `pg_dump` todo dia às 04:00 (horário de Brasília) e publica o resultado como artifact do GitHub Actions (retenção de 90 dias, plano free).

Pra ativar, configure o secret `SUPABASE_DB_URL` no repositório:

1. No Supabase: **Settings → Database → Connection string**, copie a versão **URI** (já vem com usuário/senha), algo como `postgresql://postgres.xxxx:[SUA-SENHA]@aws-...pooler.supabase.com:5432/postgres`. Troque `[SUA-SENHA]` pela senha do banco (a mesma do projeto, em Settings → Database, ou redefina uma nova lá).
2. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nome `SUPABASE_DB_URL`, cole a connection string completa.
3. O workflow já roda automaticamente a partir daí; pra testar sem esperar o agendamento, vá em **Actions → Backup do banco → Run workflow**.

Pra restaurar um backup: baixe o artifact (`.zip` com o `.sql` dentro) e rode `psql "$SUPABASE_DB_URL" -f backup-AAAA-MM-DD.sql` contra um banco vazio (não rode contra o banco de produção sem necessidade — isso recria os dados a partir do zero).

## Estrutura

- `src/lib/supabaseClient.ts` — cliente único do Supabase.
- `src/auth/` — contexto de autenticação (sessão + perfil/`is_admin`) e rota protegida.
- `src/services/` — uma função por tabela (list/search/create/update/delete via Supabase).
- `src/pages/` — uma pasta por tela.
- `supabase/migrations/` — schema, RLS e triggers versionados.
- `scripts/` — scripts avulsos (ex.: importação de dados do Trans-Água), não fazem parte do build do app.
