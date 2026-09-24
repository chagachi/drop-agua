# Drop Água

Sistema interno de gestão de vales (entregas/retiradas de água): clientes (empresas), motoristas, placas, pedidos/vales, relatórios e impressão de ticket. Reescrita do legado **Trans-Água** (`D:\Felipe\Projetos\Transagua\trans-agua` — Adonis + Create React App + MySQL).

Stack: Vite + React 19 + TypeScript, React Router 7, Supabase (Postgres + Auth + RLS, sem backend próprio), Recharts, react-select, react-datepicker. Deploy no Vercel; repositório `github.com/chagachi/drop-agua`, branch `master`. Interface, commits e comentários em português.

## Comandos

- `npm run dev` — servidor local (http://localhost:5173)
- `npm test` — Vitest (utils em `src/utils/*.test.ts` e `scripts/decimal.test.mjs`)
- `npx tsc -b` — typecheck; `npm run build` — build de produção
- `npm run lint` — oxlint

O CI (`.github/workflows/ci.yml`) roda typecheck + testes + build a cada push/PR na `master`. `backup.yml` faz `pg_dump` diário (precisa do secret `SUPABASE_DB_URL`).

## Estrutura

- `src/lib/supabaseClient.ts` — cliente único do Supabase
- `src/auth/` — sessão + perfil (`is_admin`, `is_active`), `ProtectedRoute`, `AdminRoute`
- `src/services/` — uma função por operação por tabela (`empresas`, `motoristas`, `placas`, `pedidos`, `profiles`)
- `src/pages/` — uma pasta por tela (Clientes, Motoristas, Placas, Pedidos, Relatorios, Impressao, Usuarios, Dashboard, Login)
- `src/utils/` — `calc.ts` (total líquido, agregações do dashboard), `format.ts` (máscaras/formatação)
- `supabase/migrations/` — schema, RLS e triggers numerados (`000N_*.sql`). São aplicados **manualmente** no SQL Editor do Supabase; ao criar uma migration nova, passe ao usuário as instruções para rodá-la.
- `scripts/` — scripts avulsos de importação do Trans-Água (não fazem parte do build)

## Regras de negócio e armadilhas conhecidas

- **Limite de 1000 linhas do PostgREST:** nunca carregue todas as empresas em um `<select>` (a lista era cortada na letra P). Use o combobox de busca ao vivo (debounce de 300 ms, consulta ao Supabase), como no formulário de vales e nos Relatórios.
- **`supabaseClient.ts` não pode dar `throw` no escopo do módulo** quando as env vars faltam: o minificador do Vite 8 tratava o restante do app como código morto e gerava um bundle quebrado sem erro de build. Em vez disso, mostra a tela "Configuração pendente" em runtime.
- **RLS:** todas as policies exigem `is_active_user()` (o toggle Ativo/Inativo bloqueia de verdade); escrita em empresas e update/delete em motoristas/placas exigem `is_admin()`. Triggers impedem auto-promoção e impedem não-admin de alterar `created_at` de um pedido.
- **Pedidos/vales:** em retiradas, `motorista_id` fica `null` e `motorista_nome` é texto livre (sem o hack de id fixo do legado). Preço vem do cliente (`valor_entrega`/`valor_retirada`); `total_liquido = quantidade × valor_unitario`, arredondado em 2 casas. Admin pode sobrescrever o total líquido ao editar (campo texto com 2 casas, aceita vírgula ou ponto; o valor calculado aparece como dica quando difere).
- **Relatórios** consideram apenas retiradas; têm filtros por período/cliente/motorista, atalhos de período, ordenação e exportação CSV.
- **Ticket de impressão** tem o CNPJ da Drop Água fixo em `src/pages/Impressao/ImpressaoTicket.tsx`.
- **Valores monetários do dump MySQL:** use `scripts/decimal.mjs` (`parseDecimal`). Só trate `.` como separador de milhar quando houver `,` decimal; a primeira versão transformava "90.00" em 9000 (há teste de regressão).
- `/*.sql` e `*.local` estão no `.gitignore`; o dump legado `transagua (5).sql` fica na raiz e nunca deve ser commitado. Os dados sensíveis dos scripts ficam em `scripts/.env.migration` (ignorado).

## Verificação

Mudanças de UI costumavam ser validadas no navegador contra o ambiente real (login, fluxo alterado, console sem erros) antes do commit.
