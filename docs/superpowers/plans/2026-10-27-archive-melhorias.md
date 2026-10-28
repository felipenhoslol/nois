# Archive — Melhorias de código, Supabase, busca de música e design — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o código fácil de navegar, salvar o arquivo na nuvem com Supabase, preencher músicas automaticamente por uma API de música e polir o design sem perder a identidade retrô.

**Architecture:** O app continua local-first: `localStorage` segue como cache e o app funciona sem Supabase. Quando as variáveis do Supabase existem e a pessoa faz login (link mágico por e-mail), o `ArchiveProvider` espelha cada mudança numa tabela `items` (JSON por item) e as fotos/áudios vão para o Storage em vez de virar texto base64. A busca de música usa a iTunes Search API (grátis, sem chave, com CORS), que devolve capa e prévia de 30 s tocável pelo player que já existe.

**Tech Stack:** TanStack Start + React 19, Tailwind 4, `@supabase/supabase-js` v2, iTunes Search API, Vitest + jsdom, zod (já instalado), cmdk (já instalado).

**Spec:** Pedido do usuário (2026-10-27): "analise este código, ache possíveis melhoras de design, simplicidade para achar funções, conexões com Supabase, API de música para facilitar, melhora de design com frontend-design". Não há documento de spec separado; a análise do código está na seção "Diagnóstico" abaixo.

## Diagnóstico (o que a análise encontrou)

| Problema | Onde | Tarefa |
|---|---|---|
| Sem testes nem git | projeto | 1 |
| `archive.ts` mistura categorias, tema, storage e seed (402 linhas) | `src/lib/archive.ts` | 2 |
| Lógica de aplicar tema (60 linhas de DOM) dentro do provider | `src/lib/archive-context.tsx:51-101` | 2 |
| Chaves do localStorage repetidas fora de `archive.ts` | `archive-context.tsx:42`, `settings.tsx:101-103` | 2, 8 |
| Importar backup escreve direto no localStorage e recarrega a página, sem validar | `src/routes/settings.tsx:94-115` | 8 |
| 46 componentes em `src/components/ui/` nunca importados + deps só deles | `src/components/ui/*` | 3 |
| Sintetizador, YouTube e áudio num só arquivo de 494 linhas, `any` no YouTube | `src/lib/player-context.tsx` | 4 |
| Não existe atalho para achar telas/itens rápido | — | 5 |
| Cadastro de música é todo manual (título, artista, capa, link) | `src/routes/new.$category.tsx` | 6 |
| Fotos viram base64 no localStorage (limite ~5 MB; o código já apaga imagens > 500 KB quando estoura) | `archive.ts:saveItems`, `media-picker.tsx` | 7, 9 |
| Botões primários com classes copiadas, sem foco visível, sem `prefers-reduced-motion` | rotas | 10 |

## Global Constraints

- Chaves do localStorage não mudam: `archive.items.v1` e `archive.settings.v1` (dados atuais das pessoas têm de continuar abrindo).
- Sem as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o app funciona exatamente como hoje (só local).
- Não editar `vite.config.ts` além do bloco `defineConfig` existente; o config já injeta `VITE_*`, alias `@` e plugins.
- Não reescrever histórico git já enviado (histórico já enviado). Cada tarefa deixa o app buildando (`npm run build`).
- Textos de interface em português, no tom atual (♡, kaomoji). Não trocar a identidade retrô nem os 8 temas.
- Nada de chave secreta no front: só a anon key do Supabase; acesso protegido por RLS.
- Gerenciador de pacotes: `npm` (há `package-lock.json`).

## Review Focus

1. **Sem Supabase configurado ou offline** — tudo deve funcionar como hoje; nenhuma chamada remota, nenhum erro no console. (Teste na Tarefa 7: `supabase` é `null` sem env; Tarefa 8: provider não chama remoto quando `supabase` é `null`.)
2. **Digitação rápida na busca de música** — uma resposta antiga não pode sobrescrever a mais nova. (Teste na Tarefa 6: `searchTracks` repassa o `AbortSignal`; o componente aborta a busca anterior.)
3. **Login num segundo aparelho que só tem os itens de exemplo** — os itens de exemplo não podem ser enviados e duplicados na nuvem. (Teste na Tarefa 8: `mergeItems` ignora ids `seed-*` quando o remoto não está vazio.)
4. **Editar observações digitando** — `updateItem` dispara a cada tecla; não pode virar uma requisição por tecla. (Teste na Tarefa 8: `createDebouncedUpserter` junta chamadas em 800 ms.)
5. **Arquivo de backup inválido** — JSON com formato errado não pode apagar nem corromper o arquivo atual. (Teste na Tarefa 8: `parseBackup` rejeita formato inválido.)

---

## Parte A — Código fácil de navegar

### Task 1: Git, Vitest e primeiros testes

**Files:**
- Modify: `package.json` (scripts `test`, devDeps `vitest`, `jsdom`)
- Create: `vitest.config.ts`
- Test: `src/lib/youtube.test.ts`

**Interfaces:**
- Produces: `npm test` (= `vitest run`), ambiente `jsdom` disponível com `// @vitest-environment jsdom` por arquivo.

- [ ] **Step 1:** `git init`, criar commit inicial com o código atual (`.gitignore` já existe).
- [ ] **Step 2:** `npm install` e `npm install -D vitest jsdom`. Adicionar `"test": "vitest run"` em `scripts`.
- [ ] **Step 3:** Criar `vitest.config.ts` com `defineConfig` do `vitest/config`, `resolve.alias` `@` → `./src`, `test.include: ["src/**/*.test.ts?(x)"]`. Não importar o config do app (ele traz plugins de SSR que o Vitest não precisa).
- [ ] **Step 4: Escrever o teste**

```ts
import { describe, expect, it } from "vitest";
import { extractYouTubeId, getYouTubeThumbnail } from "./youtube";

describe("extractYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=kYJqUf7D70A", "kYJqUf7D70A"],
    ["https://youtu.be/kYJqUf7D70A", "kYJqUf7D70A"],
    ["https://music.youtube.com/watch?v=kYJqUf7D70A&list=x", "kYJqUf7D70A"],
    ["https://www.youtube.com/shorts/kYJqUf7D70A", "kYJqUf7D70A"],
    ["kYJqUf7D70A", "kYJqUf7D70A"],
  ])("%s", (url, id) => expect(extractYouTubeId(url)).toBe(id));
  it("returns null for non-YouTube", () => {
    expect(extractYouTubeId("https://example.com/a.mp3")).toBeNull();
    expect(extractYouTubeId(undefined)).toBeNull();
  });
});
it("thumbnail hq", () =>
  expect(getYouTubeThumbnail("abc")).toBe("https://img.youtube.com/vi/abc/hqdefault.jpg"));
```

- [ ] **Step 5:** `npm test` → PASS (código já existe; este teste trava o comportamento antes das refatorações).
- [ ] **Step 6:** `npm run build` → sucesso.
- [ ] **Step 7: Commit** `git add -A && git commit -m "chore: add vitest and youtube parser tests"`

### Task 2: Quebrar `archive.ts` por responsabilidade e tirar o tema do provider

**Files:**
- Create: `src/lib/categories.ts`, `src/lib/settings.ts`, `src/lib/theme.ts`, `src/lib/items.ts`
- Delete: `src/lib/archive.ts`
- Modify: `src/lib/archive-context.tsx`, todos os imports de `@/lib/archive` (rotas e componentes; `grep -rn "lib/archive\"" src`)
- Test: `src/lib/items.test.ts`, `src/lib/theme.test.ts`

**Interfaces:**
- Produces:
  - `categories.ts`: `Category`, `CategoryMeta`, `CATEGORIES`, `catMeta(key: string): CategoryMeta`, `DATE_PLACE_CATEGORIES: Category[]` = `["memory","promise","said","place"]` (substitui o `if` em `new.$category.tsx:146`).
  - `settings.ts`: `Settings`, `CustomTheme`, `THEMES`, `DEFAULT_SETTINGS`, `SETTINGS_KEY`, `loadSettings()`, `saveSettings(s)`.
  - `theme.ts`: `applyTheme(root: HTMLElement, s: Settings): void` — corpo movido de `archive-context.tsx:54-101` sem mudar o comportamento.
  - `items.ts`: `Item`, `ITEMS_KEY`, `hasStoredItems(): boolean`, `loadItems()`, `saveItems(items)`, `uid()`, `seedItems()`, `parseTags(raw: string): string[]`.
  - Seed com ids fixos `seed-1` … `seed-9` (usado na Tarefa 8).

- [ ] **Step 1: Escrever os testes**

```ts
// items.test.ts
import { parseTags, seedItems } from "./items";
it("parseTags strips # and splits on comma/space", () =>
  expect(parseTags("#nostalgia, jazz  #verão")).toEqual(["nostalgia", "jazz", "verão"]));
it("parseTags empty", () => expect(parseTags("  ")).toEqual([]));
it("seed ids are stable", () =>
  expect(seedItems().every((i) => i.id.startsWith("seed-"))).toBe(true));
// categories via items.test.ts or own file:
it("catMeta falls back to note", () => expect(catMeta("xyz").key).toBe("note"));
```

```ts
// theme.test.ts  — // @vitest-environment jsdom
it("preset theme sets data-theme and clears custom vars", () => {
  const r = document.documentElement;
  r.style.setProperty("--background", "red");
  applyTheme(r, { ...DEFAULT_SETTINGS, theme: "vhs" });
  expect(r.dataset.theme).toBe("vhs");
  expect(r.style.getPropertyValue("--background")).toBe("");
});
it("custom theme writes vars", () => {
  const r = document.documentElement;
  applyTheme(r, { ...DEFAULT_SETTINGS, useCustomTheme: true,
    customTheme: { primary: "#f0f", background: "#000", surface: "#111",
      font: "pixel", borderStyle: "retro", wallpaper: "stars" } });
  expect(r.dataset.theme).toBe("custom");
  expect(r.style.getPropertyValue("--card")).toBe("#111");
  expect(r.dataset.font).toBe("pixel");
});
it("hue sets primary", () => {
  applyTheme(document.documentElement, { ...DEFAULT_SETTINGS, hue: 200 });
  expect(document.documentElement.style.getPropertyValue("--primary")).toBe("oklch(0.55 0.14 200)");
});
```

- [ ] **Step 2:** `npm test` → FAIL (módulos não existem).
- [ ] **Step 3:** Mover o código para os 4 arquivos; `parseTags` usa a mesma regex de `new.$category.tsx:62-65`. No provider: `hasStoredItems()` no lugar do `localStorage.getItem` cru e `applyTheme(document.documentElement, settings)` no lugar do bloco. Usar `parseTags` em `new.$category.tsx` e `DATE_PLACE_CATEGORIES` no `if`. Apagar `archive.ts` e corrigir imports.
- [ ] **Step 4:** `npm test` → PASS; `npm run build` → sucesso; `npx tsc --noEmit` sem erros.
- [ ] **Step 5: Commit** `refactor: split archive.ts into categories, items, settings, theme`

### Task 3: Remover componentes e dependências que ninguém usa

**Files:**
- Delete: todos os `src/components/ui/*.tsx` **exceto** `command.tsx` e `dialog.tsx` (usados na Tarefa 5). Antes, rodar e conferir que nenhum é importado fora de `ui/`:
  `for f in src/components/ui/*.tsx; do n=$(basename $f .tsx); grep -rlq "components/ui/$n\"" src --exclude-dir=ui || echo $n; done`
- Delete: `src/hooks/use-mobile.tsx` se `grep -rn use-mobile src --exclude-dir=ui` vier vazio.
- Modify: `package.json` — remover deps que ficaram sem uso (conferir cada uma com `grep -rn "<pacote>" src`): `@radix-ui/*` exceto `react-dialog` e `react-slot`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts`, `vaul`, `react-hook-form`, `@hookform/resolvers`, `date-fns`. Manter `cmdk`, `zod`, `sonner`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority` se ainda importados.

- [ ] **Step 1:** Rodar o laço acima e salvar a lista; apagar os arquivos.
- [ ] **Step 2:** `npx tsc --noEmit` → sem erros (se `command.tsx`/`dialog.tsx` importam algo apagado, como `button`, manter esse arquivo também).
- [ ] **Step 3:** Remover as deps com `npm uninstall …`; `npm run build` e `npm test` → sucesso.
- [ ] **Step 4: Commit** `chore: remove unused shadcn components and deps`

### Task 4: Separar o player em partes pequenas e tipar o YouTube

**Files:**
- Create: `src/lib/synth-audio.ts` (classe `VintageSynthAudio` movida sem mudanças)
- Modify: `src/lib/youtube.ts` (tipos), `src/lib/player-context.tsx`
- Test: `src/lib/youtube.test.ts` (adicionar)

**Interfaces:**
- Produces: `youtube.ts` exporta `type YTPlayer = { loadVideoById(id: string): void; playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void; setVolume(v: number): void; setPlaybackRate(r: number): void; getCurrentTime(): number; getDuration(): number }`, `rpmToRate(rpm: 33 | 45): number` (33 → 1, 45 → 1.25). `window.YT` tipado como `{ Player: new (el: string, opts: unknown) => YTPlayer } | undefined`.

- [ ] **Step 1: Teste** `expect(rpmToRate(33)).toBe(1); expect(rpmToRate(45)).toBe(1.25);`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Criar `rpmToRate` e usar nas 4 ocorrências de `rpm === 45 ? 1.25 : 1.0`; trocar `useRef<any>` por `useRef<YTPlayer | null>` e remover as checagens `&& ytPlayerRef.current.metodo` que o tipo torna desnecessárias (manter `?.`). Mover a classe do sintetizador.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit`, `npm run build` → sucesso. Manual: `npm run dev`, tocar "Blue Moon" (YouTube), pausar, mudar para 45 RPM, tocar um item sem áudio (sintetizador).
- [ ] **Step 5: Commit** `refactor: split synth out of player and type YouTube player`

### Task 5: Paleta de comandos (⌘K / Ctrl+K) para achar tudo rápido

**Files:**
- Create: `src/lib/search.ts`, `src/components/command-palette.tsx`
- Modify: `src/routes/search.tsx` (usar `matchesQuery`), `src/routes/__root.tsx` (montar a paleta), `src/components/side-nav.tsx` (botão "buscar ⌘K")
- Test: `src/lib/search.test.ts`

**Interfaces:**
- Consumes: `CommandDialog`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty` de `@/components/ui/command`; `usePlayer().playTrack`.
- Produces: `matchesQuery(item: Item, q: string): boolean` (mesma regra de `search.tsx:41-46`: junta title, subtitle, notes, reason, status, place, tags; minúsculas; ignora `#` inicial; query vazia → `true`).

- [ ] **Step 1: Teste**

```ts
const it1 = { ...base, title: "Blue Moon", tags: ["jazz"] };
expect(matchesQuery(it1, "#JAZZ")).toBe(true);
expect(matchesQuery(it1, "moon")).toBe(true);
expect(matchesQuery(it1, "rock")).toBe(false);
expect(matchesQuery(it1, "  ")).toBe(true);
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `matchesQuery` e usar em `search.tsx`. Paleta: abre com `Ctrl/⌘+K` (listener em `keydown`) e pelo botão na SideNav; grupos "Ir para" (Início, Busca, Favoritos, Caixa, Configurações + uma entrada por categoria `/c/$category`), "Novo" (`/new/$category` por categoria), "Itens" (primeiros 20 com `matchesQuery`, abre `/item/$id`; itens `music` com `audioUrl` ganham ação "▶ tocar" que chama `playTrack`). Passar `shouldFilter={false}` no `Command` para itens e filtrar com `matchesQuery`.
- [ ] **Step 4:** `npm test` → PASS. Manual: Ctrl+K → digitar "jazz" → Enter abre o item; Esc fecha; funciona no celular pelo botão.
- [ ] **Step 5: Commit** `feat: add command palette with Ctrl+K`

---

## Parte B — API de música

### Task 6: Buscar música na iTunes Search API e preencher o formulário

**Files:**
- Create: `src/lib/music-search.ts`, `src/components/music-search.tsx`
- Modify: `src/routes/new.$category.tsx` (mostrar quando `meta.key === "music"`, acima do campo Título)
- Test: `src/lib/music-search.test.ts`

**Interfaces:**
- Produces:
  - `type TrackResult = { title: string; artist: string; album?: string; artwork?: string; previewUrl?: string; link?: string }`
  - `searchTracks(term: string, signal?: AbortSignal): Promise<TrackResult[]>`
  - `<MusicSearch onPick={(t: TrackResult) => void} />`

Endpoint: `https://itunes.apple.com/search?term=<encodeURIComponent(term)>&media=music&entity=song&limit=8&country=BR`. Mapeamento: `trackName→title`, `artistName→artist`, `collectionName→album`, `artworkUrl100` com `100x100bb` trocado por `600x600bb` → `artwork`, `previewUrl→previewUrl`, `trackViewUrl→link`.

- [ ] **Step 1: Teste** (mock de `globalThis.fetch` com `vi.fn`)

```ts
it("maps results and upsizes artwork", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ results: [{
    trackName: "Blue Moon", artistName: "Chet Baker", collectionName: "Chet",
    artworkUrl100: "https://x/100x100bb.jpg", previewUrl: "https://p.m4a",
    trackViewUrl: "https://music.apple.com/t" }] })));
  expect(await searchTracks("blue moon")).toEqual([{ title: "Blue Moon", artist: "Chet Baker",
    album: "Chet", artwork: "https://x/600x600bb.jpg", previewUrl: "https://p.m4a",
    link: "https://music.apple.com/t" }]);
  expect(fetchMock.mock.calls[0][0]).toContain("term=blue%20moon");
});
it("blank term returns [] without fetching", async () => {
  expect(await searchTracks("  ")).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("non-ok response throws", async () => {
  fetchMock.mockResolvedValue(new Response("", { status: 503 }));
  await expect(searchTracks("x")).rejects.toThrow();
});
it("passes the abort signal", async () => {
  const c = new AbortController();
  fetchMock.mockResolvedValue(new Response('{"results":[]}'));
  await searchTracks("x", c.signal);
  expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: c.signal });
});
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `searchTracks`. Componente: input "buscar música (nome ou artista)", espera 300 ms após a última tecla, aborta a busca anterior com `AbortController`, mostra lista com capa 40px + título + artista, estados "buscando…", "nada encontrado ♡" e erro "não consegui buscar agora" (toast não; texto inline). Ao escolher: `onPick`. No formulário: `title ← t.title`, `subtitle ← [artist, album].filter(Boolean).join(" · ")`, `imageUrl ← artwork`, `audioUrl ← previewUrl`, e guarda `link`; adicionar estado `link` passado ao `addItem`. Usuário ainda pode editar tudo e colar link do YouTube no MediaPicker (que tem prioridade no player por já existir essa ordem em `playTrack`).
- [ ] **Step 4:** `npm test` → PASS. Manual: Nova música → buscar "chet baker" → escolher → salvar → tocar no toca-discos (prévia de 30 s pelo `<audio>`).
- [ ] **Step 5: Commit** `feat: autofill music from iTunes search`

---

## Parte C — Supabase

### Task 7: Cliente, tabelas, RLS e Storage

**Files:**
- Create: `supabase/migrations/20261027000000_archive.sql`, `src/lib/supabase.ts`, `.env.example`
- Modify: `package.json` (`@supabase/supabase-js`)
- Test: `src/lib/supabase.test.ts`

**Interfaces:**
- Produces: `supabase: SupabaseClient | null` (null quando falta `import.meta.env.VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY`). `.env.example` lista as duas variáveis vazias.

SQL (exato):

```sql
create table public.items (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.items enable row level security;
alter table public.settings enable row level security;
create policy "own items" on public.items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own settings" on public.settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('media', 'media', true);
create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
```

(Item guardado inteiro em `data` jsonb para não precisar de migração a cada campo novo. Bucket público para `<img src>` funcionar direto; os caminhos têm uuid e não são listáveis sem policy de select.)

- [ ] **Step 1: Teste** — `vi.stubEnv` sem as variáveis, `vi.resetModules()`, importar `./supabase` → `expect(supabase).toBeNull()`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** `npm install @supabase/supabase-js`; criar `supabase.ts` com `createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } })` só no navegador (`typeof window !== "undefined"`), senão `null`.
- [ ] **Step 4:** `npm test` → PASS. Pessoa usuária: criar o projeto Supabase, rodar o SQL no SQL Editor, colar URL/anon key em `.env`, e em Auth → URL Configuration adicionar a URL do app em Redirect URLs.
- [ ] **Step 5: Commit** `feat: add supabase client and schema`

### Task 8: Login por link mágico e sincronização dos itens

**Files:**
- Create: `src/lib/sync.ts`, `src/components/sync-section.tsx`
- Modify: `src/lib/archive-context.tsx`, `src/routes/settings.tsx` (adicionar `<SyncSection />`; trocar `handleImport` por `parseBackup` + `replaceAll`)
- Test: `src/lib/sync.test.ts`

**Interfaces:**
- Consumes: `supabase` (Tarefa 7), `Item`, `Settings`, `seedItems` ids `seed-*` (Tarefa 2).
- Produces:
  - `mergeItems(local: Item[], remote: Item[]): { merged: Item[]; toUpload: Item[] }` — união por `id`, remoto vence em conflito; `toUpload` = itens só locais; se `remote.length > 0`, itens `seed-*` só locais são descartados (nem em `merged`, nem em `toUpload`). `merged` ordenado por `createdAt` desc.
  - `parseBackup(json: unknown): { items: Item[]; settings?: Partial<Settings> }` — schema zod (`items` array de objetos com `id`, `category`, `title`, `createdAt` string; resto `passthrough`); lança erro se inválido.
  - `createDebouncedUpserter(flush: (items: Item[]) => Promise<void>, ms = 800): { push(item: Item): void; flushNow(): Promise<void> }` — guarda a última versão por `id` e chama `flush` uma vez após `ms` sem novas chamadas.
  - `fetchRemote(): Promise<{ items: Item[]; settings: Settings | null }>`, `upsertItems(items: Item[])`, `deleteRemoteItem(id: string)`, `saveRemoteSettings(s: Settings)` — todos usam `supabase!` e só são chamados com sessão.
  - Contexto ganha `replaceAll(items: Item[], settings?: Partial<Settings>): void` e `user: { email: string } | null`.

- [ ] **Step 1: Testes**

```ts
const a = mk("a"), b = mk("b"), seed = mk("seed-1");
it("uploads local-only, remote wins", () => {
  const r = mergeItems([a, { ...b, title: "local" }], [{ ...b, title: "remote" }]);
  expect(r.toUpload.map((i) => i.id)).toEqual(["a"]);
  expect(r.merged.find((i) => i.id === "b")!.title).toBe("remote");
});
it("drops local seed when remote has data", () => {
  const r = mergeItems([seed, a], [b]);
  expect(r.merged.map((i) => i.id).sort()).toEqual(["a", "b"]);
  expect(r.toUpload.map((i) => i.id)).toEqual(["a"]);
});
it("first sync uploads everything incl. seed", () =>
  expect(mergeItems([seed], []).toUpload).toHaveLength(1));
it("parseBackup rejects bad shape", () => {
  expect(() => parseBackup({ items: "x" })).toThrow();
  expect(() => parseBackup({ items: [{ title: "sem id" }] })).toThrow();
});
it("debounces by id", async () => {
  vi.useFakeTimers(); const flush = vi.fn().mockResolvedValue(undefined);
  const u = createDebouncedUpserter(flush, 800);
  u.push({ ...a, notes: "o" }); u.push({ ...a, notes: "oi" }); u.push(b);
  await vi.advanceTimersByTimeAsync(800);
  expect(flush).toHaveBeenCalledTimes(1);
  expect(flush.mock.calls[0][0]).toEqual([{ ...a, notes: "oi" }, b]);
});
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `sync.ts`. No provider: se `supabase` existe, ouvir `supabase.auth.onAuthStateChange`; ao entrar com sessão → `fetchRemote` → `mergeItems` → `setItems(merged)` → `upsertItems(toUpload)`; settings remotas (se houver) substituem as locais, senão envia as locais. Com sessão, `addItem`/`updateItem`/`toggleFavorite` chamam `upserter.push(itemAtualizado)`, `removeItem` chama `deleteRemoteItem`, `updateSettings` salva remoto (debounce 800 ms). Erro remoto → `toast.error("não consegui salvar na nuvem, ficou guardado aqui ♡")`. Sem `supabase` ou sem sessão: nada remoto. `flushNow` no `beforeunload`. `SyncSection`: se `supabase` é null mostra "sincronização não configurada"; sem sessão: campo e-mail + botão "receber link de acesso" (`signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/settings" } })`); com sessão: e-mail, "sincronizado ♡" e botão "sair". Import de backup: `parseBackup` → `replaceAll` → toast; sem `location.reload`.
- [ ] **Step 4:** `npm test` → PASS. Manual com Supabase configurado: login → itens aparecem na tabela `items`; editar observação digitando → uma requisição após parar (aba Network); abrir em janela anônima, logar → mesmos itens, sem duplicar os de exemplo; sem `.env` → app igual a hoje, console limpo.
- [ ] **Step 5: Commit** `feat: magic-link login and item sync with supabase`

### Task 9: Fotos e áudios no Supabase Storage

**Files:**
- Modify: `src/lib/sync.ts` (adicionar `uploadMedia`), `src/components/media-picker.tsx`
- Test: `src/lib/sync.test.ts` (adicionar)

**Interfaces:**
- Produces: `uploadMedia(file: Blob, ext: string): Promise<string | null>` — com sessão, envia para `media/<user_id>/<uid()>.<ext>` e devolve a URL pública; sem `supabase`/sessão devolve `null`.

- [ ] **Step 1: Teste** — com `supabase` mockado como `null`: `expect(await uploadMedia(new Blob(["x"]), "jpg")).toBeNull()`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** No `MediaPicker`, depois de comprimir (JPEG continua passando pelo canvas; GIF e áudio vão como estão), tentar `uploadMedia`; se devolver URL usa a URL, se `null` mantém o data URL de hoje. Converter o data URL comprimido em Blob com `await (await fetch(dataUrl)).blob()`. Mostrar "enviando…" enquanto sobe; erro de upload → toast e volta para o data URL.
- [ ] **Step 4:** `npm test` → PASS. Manual logado: anexar foto → `item.image` começa com `https://<projeto>.supabase.co/storage/`; deslogado: continua `data:image/jpeg`.
- [ ] **Step 5: Commit** `feat: store media in supabase storage when signed in`

---

## Parte D — Design

### Task 10: Passada de design (frontend-design + ux-audit)

**Files:**
- Modify: `src/styles.css`, `src/components/archive-ui.tsx`, rotas em `src/routes/*.tsx` que tiverem o botão primário copiado (`grep -rn "bg-primary px-4 py-3" src/routes`)

**Interfaces:**
- Produces: classe CSS `.btn-primary` (substitui `press rounded-[var(--radius)] bg-primary px-4 py-3 font-medium text-primary-foreground shadow-lg hover:brightness-105`) e `.btn-ghost`; componente `ItemCardSkeleton` em `archive-ui.tsx`.

Antes de editar, carregar as skills `frontend-design:frontend-design` e `vectorlab-ux-skills:ux-audit` e auditar Início, Categoria, Item, Novo, Busca e Configurações. Manter a identidade retrô (cassete, polaroid, kaomoji, 8 temas). Resultados obrigatórios:

- [ ] **Step 1:** Criar `.btn-primary`/`.btn-ghost` em `styles.css` e trocar as cópias nas rotas.
- [ ] **Step 2:** Foco visível: `.press:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`.
- [ ] **Step 3:** Respeitar o sistema: `@media (prefers-reduced-motion: reduce)` desliga as mesmas animações que `[data-anim="false"]` já desliga (reusar o seletor existente).
- [ ] **Step 4:** Enquanto `ready === false`, Início e Categoria mostram 4 `ItemCardSkeleton` em vez de piscar o estado vazio.
- [ ] **Step 5:** Botões só com ícone/emoji (coração, estrelas, play) com `aria-label` e área de toque ≥ 44px.
- [ ] **Step 6:** Aplicar os demais achados da auditoria que forem de baixo risco (espaçamento 4/8, hierarquia de títulos); listar os que ficarem de fora no commit.
- [ ] **Step 7: Verificação:** `npm run dev`; no navegador, cada página em 375px e 1280px nos temas `cassette`, `darkvintage` e um tema custom com fonte pixel: sem rolagem horizontal, texto legível, foco visível navegando com Tab. `npm run build` → sucesso.
- [ ] **Step 8: Commit** `style: shared buttons, focus rings, reduced motion, skeletons`

---

## Fora do escopo (de propósito)

- Busca no YouTube/Spotify: precisa de chave de API ou OAuth; o colar-link do YouTube já existe.
- Modo colaborativo (duas pessoas no mesmo arquivo): exigiria mudar o RLS para compartilhamento.
- Resolver conflito por data de edição: `mergeItems` usa "remoto vence"; suficiente para um dono usando um aparelho por vez.
