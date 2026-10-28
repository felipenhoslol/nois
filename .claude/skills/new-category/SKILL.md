---
name: new-category
description: Adiciona uma nova gaveta (categoria) ao Archive em todos os lugares necessários. Uso: /new-category <nome da categoria>
disable-model-invocation: true
---

# Nova categoria: $ARGUMENTS

1. Escolha uma `key` curta em inglês, minúscula, sem espaço (ex.: `recipe`). Confira que ela não existe em `CATEGORIES`.
2. Em `src/lib/categories.ts`:
   - Acrescente a `key` ao tipo `Category`.
   - Acrescente um objeto em `CATEGORIES` **antes** de `note` (o `catMeta` usa o último item como fallback, que precisa continuar sendo `note`), com:
     - `label` (singular, português), `plural`, `emoji` (um só);
     - `kaomoji` diferente dos que já existem;
     - `empty`: frase de gaveta vazia no tom do app, terminando com ` ♡`;
     - `statuses` só se fizer sentido (lista curta, minúsculas);
     - `fields: [{ key: "subtitle", label: "..." }]` com o rótulo do campo de detalhe.
3. Se a categoria precisa de Data e Lugar, inclua a `key` em `DATE_PLACE_CATEGORIES` (`src/lib/categories.ts`).
4. Procure outros lugares que listam categorias à mão: `grep -rn '"memory"' src --include=*.tsx`. Ajuste se precisar.
5. Rode `npx tsc --noEmit` e `npm run build`. Abra `/c/<key>` e `/new/<key>` no navegador para conferir.
6. Diga para a pessoa qual `key`, emoji e kaomoji escolheu.
