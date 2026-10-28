@AGENTS.md

# Archive — regras do projeto

- App pessoal em TanStack Start + React 19 + Tailwind 4, conectado à Lovable.
- Gerenciador de pacotes: `npm` (há `package-lock.json`). Scripts: `npm run dev`, `npm run build`, `npm run lint`.
- Textos de interface em português, no tom atual: carinhoso, com ♡ e kaomoji. Não trocar a identidade retrô nem os 8 temas.
- Chaves do localStorage nunca mudam: `archive.items.v1` e `archive.settings.v1` (são os dados das pessoas).
- Não editar `src/routeTree.gen.ts` (gerado pelo TanStack Router) nem os lockfiles à mão.
- Não editar `vite.config.ts` além do bloco `defineConfig`; o config da Lovable já traz plugins, alias `@` e `VITE_*`.
- Categorias ficam em `CATEGORIES` (`src/lib/categories.ts`). Para criar uma nova, use `/new-category`.
- Supabase: só a anon key no front; todo acesso protegido por RLS. Revise migrações e chamadas ao `supabase` com o agente `rls-reviewer`.
- Plano de melhorias em andamento: `docs/superpowers/plans/2026-10-27-archive-melhorias.md`.
