# Redesign visual do Archive — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o visual e a navegação do Archive conforme o spec (Outfit maior, layout A, temas por aparelho com contraste garantido, Adicionar por gaveta, música por busca ou link YouTube/Spotify, player capa + vinil), sem mudar o banco.

**Architecture:** As cores dos temas passam a viver em TypeScript (`src/lib/themes.ts`), de onde saem o CSS injetado no `<head>` e o teste de contraste. Tema e animações ficam no aparelho (`src/lib/device.ts`), aplicados antes da pintura por um script inline. As telas são reescritas em cima de `useArchive`/`usePlayer`, e o player ganha um modo Spotify (IFrame API) ao lado do YouTube e do `<audio>`.

**Tech Stack:** TanStack Start/Router, React 19, Tailwind 4, lucide-react (já instalado), Vitest + jsdom, iTunes Search API, oEmbed do YouTube e do Spotify, Spotify IFrame API.

**Spec:** `docs/superpowers/specs/2026-10-28-redesign-visual-design.md`

## Global Constraints

- O banco não muda: nada em `supabase/`, nem em `src/lib/sync.ts`, e a lógica de sincronização de `src/lib/archive-context.tsx` fica igual. Itens continuam no formato `Item`.
- Os campos do tipo `Settings` continuam existindo (backups antigos); só a tela deixa de mostrar `hue`, `wallpaper`, `customTheme`, `useCustomTheme`, `decorations`, `privacy`.
- Fonte única: Outfit 400/500/600/700. Nenhum `font-mono`, `font-hand`, `font-pixel`, `font-serif` nem `uppercase` nas telas ao final.
- Escala de tipo: título de tela 30px/700, seção 20px/600, título de item 17px/500, corpo e campos 16px/400 (campos ≥16px), secundário 14px, mínimo 13px (legendas do menu de baixo).
- Todo par texto/fundo de todo tema ≥ 4,5:1 (teste da Tarefa 1).
- Alvo de toque ≥ 44px; linha de item ≥ 64px de altura; coluna única até 640px; margem lateral 20px no celular; sem rolagem lateral de 375 a 1280px.
- Cantos: 16px em blocos (linhas, campos, botão Adicionar), 999px em selos. Sombra só no player e no mini player.
- Metadados sem "A · B": em duas linhas ou com a gaveta como selo.
- Kaomoji e ♡ só em estados vazios, saudação e confirmações. Textos em português, verbos claros ("Adicionar", "Guardar música", "Procurar").
- Disco gira só com `isPlaying === true`, 1 volta a cada 4s; gira mesmo com `prefers-reduced-motion`; para se `animations === false` no aparelho.
- Os 51 testes atuais continuam passando; `npx tsc --noEmit` e `npm run build` limpos a cada tarefa.

## Review Focus

1. **Tema antigo salvo no aparelho ou na nuvem** (`cassette`, `custom` do MySpace etc.) — abre no tema novo equivalente, nunca sem tema. (Teste na Tarefa 1: `migrateTheme`.)
2. **Primeira pintura** — a página não pode piscar no tema padrão antes do tema da pessoa, nem dar erro de hydration por causa do `data-theme`. (Verificação na Tarefa 1, passo 7.)
3. **Links de Spotify em formatos variados** (`/intl-pt/track/ID?si=…`, `spotify:track:ID`) e links que não são faixa (álbum, playlist) — faixa é reconhecida; não-faixa mostra aviso em vez de salvar algo quebrado. (Teste na Tarefa 5.)
4. **Link de YouTube cujo vídeo não existe mais** (oEmbed 404, como o "Blue Moon" de exemplo) — ainda salva, com a miniatura e o título para digitar. (Teste na Tarefa 5.)
5. **Trocar de uma música Spotify para uma do YouTube (e vice-versa)** — a anterior para; nunca tocam duas. (Teste na Tarefa 6.)

---

## Estrutura de arquivos

| Arquivo                                                                | Responsabilidade                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/lib/contrast.ts` (novo)                                           | `contrastRatio(a, b)` para hex                                       |
| `src/lib/themes.ts` (novo)                                             | os 6 temas, tokens e o CSS gerado                                    |
| `src/lib/device.ts` (novo)                                             | preferências do aparelho (tema, animações), migração, script de boot |
| `src/lib/theme.ts` (reescrito)                                         | `applyTheme(root, prefs)`                                            |
| `src/lib/home.ts` (novo)                                               | `pickHomeDrawers`                                                    |
| `src/lib/music-link.ts` (novo)                                         | reconhecer e resolver links de YouTube/Spotify                       |
| `src/lib/spotify.ts` (novo)                                            | carregar a Spotify IFrame API                                        |
| `src/lib/player-context.tsx`                                           | modo Spotify, anterior/próxima                                       |
| `src/components/bottom-nav.tsx`, `side-nav.tsx`                        | navegação com ícones                                                 |
| `src/components/item-row.tsx` (novo, substitui `ItemCard`)             | linha grande de item                                                 |
| `src/components/music-picker.tsx` (novo, substitui `music-search.tsx`) | busca ou link                                                        |
| `src/components/player.tsx` (novo, substitui `turntable.tsx`)          | player grande capa + vinil                                           |
| `src/components/mini-player.tsx`, `now-playing.tsx` (novo)             | mini player e cartão "Tocando agora"                                 |
| `src/routes/*.tsx`                                                     | telas reescritas                                                     |
| `src/styles.css`                                                       | base nova; sai tudo de tema/fonte/wallpaper antigo                   |

---

### Task 1: Temas, contraste e preferências do aparelho

**Files:**

- Create: `src/lib/contrast.ts`, `src/lib/themes.ts`, `src/lib/device.ts`, `src/lib/themes.test.ts`, `src/lib/device.test.ts`
- Modify: `src/lib/theme.ts`, `src/lib/theme.test.ts`, `src/lib/archive-context.tsx` (só o efeito de tema e duas entradas novas no contexto), `src/lib/settings.ts` (remover `THEMES` e o tipo `CustomTheme` deixa de ser usado pela tela), `src/routes/__root.tsx` (head e `<html>`), `src/styles.css` (remover blocos `[data-theme=…]`, `[data-font…]`, `[data-border-style…]`, `[data-wallpaper…]`)

**Interfaces:**

- Produces:
  - `contrastRatio(a: string, b: string): number` — WCAG 2.1 a partir de `#RRGGBB`.
  - `type ThemeKey = "noite" | "algodao" | "fita" | "hifi" | "vhs" | "ceu"`; `type ThemeTokens = { background; card; foreground; muted; mutedForeground; primary; primaryForeground; border; destructive: string }`; `THEMES: { key: ThemeKey; label: string; mood: string; dark: boolean; tokens: ThemeTokens }[]`; `DEFAULT_THEME: ThemeKey = "ceu"`; `themeCss(): string` (um bloco `[data-theme="<key>"]{…}` por tema mais `:root` = `ceu`).
  - `type DevicePrefs = { theme: ThemeKey; animations: boolean }`; `DEVICE_KEY = "archive.device.v1"`; `migrateTheme(old?: string | null): ThemeKey`; `loadDevicePrefs(fallback: { theme?: string; animations?: boolean }): DevicePrefs`; `saveDevicePrefs(p: DevicePrefs): void`; `THEME_BOOT_SCRIPT: string`.
  - `applyTheme(root: HTMLElement, prefs: DevicePrefs): void` — define `data-theme` e `data-anim`.
  - Contexto: `useArchive().device: DevicePrefs` e `useArchive().updateDevice(patch: Partial<DevicePrefs>): void`.

Valores dos tokens (spec). `muted` (superfície alternada), `border` (linha discreta) e `destructive` (vermelho de apagar, ≥4,5:1 sobre `card`) ficam à escolha do builder, dentro do clima de cada tema:

| key     | label        | background | card    | foreground | mutedForeground | primary | primaryForeground |
| ------- | ------------ | ---------- | ------- | ---------- | --------------- | ------- | ----------------- |
| noite   | Noite        | #14161D    | #1D2029 | #ECEDF2    | #A3A8B6         | #8FB3FF | #0F1320           |
| algodao | Algodão-doce | #FFF5F7    | #FFFFFF | #3A2230    | #7A5566         | #C92A62 | #FFFFFF           |
| fita    | Fita verde   | #EEF1E8    | #FAFBF6 | #22281F    | #59614F         | #3D6B4C | #FFFFFF           |
| hifi    | Hi-Fi        | #1B1714    | #27211C | #F2EADF    | #B8AA98         | #E8A04B | #1B1714           |
| vhs     | VHS          | #17121F    | #231A2F | #EFE7F8    | #B3A6C6         | #C69BFF | #17121F           |
| ceu     | Céu          | #F2F6FB    | #FFFFFF | #1E2A3A    | #556377         | #2A64C8 | #FFFFFF           |

Mapeamento para as variáveis CSS que o Tailwind já usa: `--background`, `--card` e `--paper` = card, `--foreground`, `--card-foreground`, `--secondary-foreground` e `--accent-foreground` = foreground, `--muted`, `--secondary` e `--accent` = muted, `--muted-foreground`, `--primary`, `--primary-foreground`, `--border`, `--destructive`, `--radius: 1rem`.

- [ ] **Step 1: Testes**

```ts
// themes.test.ts
it.each(THEMES)("$key has readable text", ({ tokens: t }) => {
  for (const [fg, bg] of [
    [t.foreground, t.background],
    [t.foreground, t.card],
    [t.mutedForeground, t.background],
    [t.mutedForeground, t.card],
    [t.primary, t.background],
    [t.primary, t.card],
    [t.primaryForeground, t.primary],
    [t.destructive, t.card],
  ])
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
it("contrastRatio black/white is 21", () =>
  expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1));
it("themeCss has one block per theme", () => {
  const css = themeCss();
  for (const t of THEMES) expect(css).toContain(`[data-theme="${t.key}"]`);
  expect(css).toContain("--background:#14161D");
});
it("there are exactly 6 themes and ceu is default", () => {
  expect(THEMES.map((t) => t.key)).toEqual(["noite", "algodao", "fita", "hifi", "vhs", "ceu"]);
  expect(DEFAULT_THEME).toBe("ceu");
});
```

```ts
// device.test.ts  (// @vitest-environment jsdom)
it.each([
  ["darkvintage", "noite"],
  ["computer", "noite"],
  ["custom", "noite"],
  ["soft", "algodao"],
  ["y2k", "algodao"],
  ["cassette", "fita"],
  ["cozy", "fita"],
  ["hifi", "hifi"],
  ["vhs", "vhs"],
  ["noite", "noite"],
  [undefined, "ceu"],
  ["xyz", "ceu"],
])("migrateTheme(%s) → %s", (old, key) => expect(migrateTheme(old)).toBe(key));
it("first load copies the shared settings once", () => {
  localStorage.clear();
  expect(loadDevicePrefs({ theme: "cassette", animations: false })).toEqual({
    theme: "fita",
    animations: false,
  });
});
it("stored prefs win over shared settings", () => {
  saveDevicePrefs({ theme: "algodao", animations: true });
  expect(loadDevicePrefs({ theme: "vhs", animations: false })).toEqual({
    theme: "algodao",
    animations: true,
  });
});
it("corrupt storage falls back", () => {
  localStorage.setItem(DEVICE_KEY, "{oops");
  expect(loadDevicePrefs({}).theme).toBe("ceu");
});
```

Reescrever `theme.test.ts`: `applyTheme(root, { theme: "vhs", animations: false })` → `root.dataset.theme === "vhs"` e `root.dataset.anim === "false"`.

- [ ] **Step 2:** `npx vitest run src/lib/themes.test.ts src/lib/device.test.ts src/lib/theme.test.ts` → FAIL (módulos não existem).
- [ ] **Step 3:** Implementar `contrast.ts`, `themes.ts`, `device.ts` e `theme.ts`. `THEME_BOOT_SCRIPT` é um IIFE em string que lê `localStorage[DEVICE_KEY]` dentro de `try` e define `document.documentElement.dataset.theme`/`anim` (com `migrateTheme` inlined como mapa). No provider: `device` vem de `loadDevicePrefs({ theme: settings.theme, animations: settings.animations })` depois de carregar as settings; o efeito de tema chama `applyTheme(document.documentElement, device)`; `updateDevice` salva com `saveDevicePrefs`. As settings deixam de aplicar tema.
- [ ] **Step 4:** Em `__root.tsx`: `<html lang="pt-BR" data-theme="ceu" data-anim="true" suppressHydrationWarning>`; no `<head>`, `<style dangerouslySetInnerHTML={{ __html: themeCss() }} />` e `<script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />` antes do `<HeadContent />`. Em `styles.css`, remover os blocos de tema, fonte, borda e wallpaper antigos e o `:root` antigo.
- [ ] **Step 5:** `npx vitest run` → tudo PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 6:** Settings temporária: o seletor de tema atual de `settings.tsx` passa a listar `THEMES` e chamar `updateDevice({ theme })` (a tela inteira é refeita na Tarefa 9).
- [ ] **Step 7: Verificação no navegador:** `npm run dev`; com `localStorage["archive.device.v1"] = '{"theme":"noite","animations":true}'`, recarregar `/` com cache desligado: a página já aparece escura na primeira pintura e o console não mostra "Hydration failed". Trocar para `algodao` em Ajustes e recarregar: continua rosa.
- [ ] **Step 8: Commit** `feat: device themes with guaranteed contrast`

### Task 2: Tipografia, base visual e navegação

**Files:**

- Modify: `src/routes/__root.tsx` (link de fontes, layout), `src/styles.css` (`@theme` fontes, utilitários), `src/components/bottom-nav.tsx`, `src/components/side-nav.tsx`, `src/components/archive-ui.tsx` (`Field`, `inputClass`, `SectionTitle`, `EmptyDrawer`)

**Interfaces:**

- Consumes: variáveis CSS da Tarefa 1.
- Produces: utilitários CSS `btn-primary` (altura 52px, raio 16px), `surface-row` (fundo `--card`, borda 1px `--border`, raio 16px, min-height 64px, padding 12px), `chip` (raio 999px, 14px, altura 36px); `NAV_ITEMS` em `bottom-nav.tsx`: `{ to: "/", label: "Início", icon: Home } , { to: "/c/music", label: "Músicas", icon: Music } , { to: "/add", label: "Adicionar", icon: Plus, primary: true } , { to: "/favorites", label: "Favoritos", icon: Heart } , { to: "/settings", label: "Ajustes", icon: Settings }` (ícones de `lucide-react`), reutilizado pela `side-nav`.

- [ ] **Step 1:** Trocar o link do Google Fonts por `family=Outfit:wght@400;500;600;700&display=swap`; em `@theme`: `--font-sans: "Outfit", ui-sans-serif, system-ui, sans-serif;` e remover `--font-mono/hand/pixel/serif`. `body` com 16px, entrelinha 1.5.
- [ ] **Step 2:** Bottom nav (celular): 5 itens de `NAV_ITEMS`, ícone 24px com legenda de 13px, ativo na cor `--primary`, item "Adicionar" como círculo de 56px em `--primary`. Cada link tem `aria-label`. Side nav (≥768px): os mesmos itens em linhas de 48px, mais o botão Ctrl+K existente; o texto "Arquivo pessoal" em caixa alta sai.
- [ ] **Step 3:** Layout: coluna `max-w-[640px]`, `px-5` no celular, `pb-32` (espaço para mini player + menu).
- [ ] **Step 4:** `archive-ui.tsx`: `Field` com rótulo 14px/500 sem caixa alta; `inputClass` com 16px, altura 48px, raio 16px; `SectionTitle` 20px/600; `EmptyDrawer` com kaomoji + texto 16px + botão de ação. `RetroClock` e `HeartButton` antigos ficam até a Tarefa 3/8.
- [ ] **Step 5: Verificação:** `npx tsc --noEmit` e `npx vitest run` limpos; no navegador a 375px, o menu de baixo mostra 5 ícones com legenda e o do meio em destaque; Tab percorre o menu com foco visível.
- [ ] **Step 6: Commit** `feat: Outfit type scale and icon navigation`

### Task 3: Tela inicial (layout A)

**Files:**

- Create: `src/lib/home.ts`, `src/lib/home.test.ts`, `src/components/item-row.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**

- Consumes: `CATEGORIES`, `Item`, utilitários da Tarefa 2.
- Produces: `pickHomeDrawers(items: Item[], max = 6): CategoryMeta[]`; `<ItemRow item={Item} />` (capa 48px ou ícone da gaveta, título 17px, detalhe 14px, selo da gaveta, coração à direita com alvo de 44px; link para `/item/$id`), usado também nas Tarefas 7 e 8.

- [ ] **Step 1: Teste**

```ts
const mk = (category: Category) => ({ ...base, id: Math.random().toString(), category });
it("orders drawers by how many items they have, max 6", () => {
  const items = [mk("food"), mk("food"), mk("music"), mk("gift"), mk("gift"), mk("gift")];
  expect(pickHomeDrawers(items).map((c) => c.key)).toEqual(["gift", "food", "music"]);
});
it("ties keep CATEGORIES order", () =>
  expect(pickHomeDrawers([mk("book"), mk("music")]).map((c) => c.key)).toEqual(["music", "book"]));
it("caps at max", () => expect(pickHomeDrawers(CATEGORIES.map((c) => mk(c.key))).length).toBe(6));
it("empty archive shows music, gift, memory", () =>
  expect(pickHomeDrawers([]).map((c) => c.key)).toEqual(["music", "gift", "memory"]));
```

- [ ] **Step 2:** `npx vitest run src/lib/home.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `pickHomeDrawers` e `ItemRow`. Reescrever `index.tsx` na ordem do spec: saudação "oi, vocês dois ♡" (14px, suave) + `settings.archiveName` (30px/700) + `settings.favoriteQuote` (16px, suave); busca (um `Link` com cara de campo, 52px, para `/search`); "Adicionar" (`btn-primary`, ícone Plus, para `/add`); "Últimos guardados" (6 `ItemRow`, ou esqueleto enquanto `!ready`, ou `EmptyDrawer` com "Nada guardado ainda" e ação "Adicionar"); "Gavetas" em selos de `pickHomeDrawers` e um selo "Todas as gavetas" que expande a lista completa ali mesmo (`useState`); link discreto "Abrir uma lembrança surpresa" para `/box`. Saem polaroid, relógio, contadores.
- [ ] **Step 4:** `npx vitest run` PASS; navegador a 375px: sem rolagem lateral; títulos longos cortam com "…".
- [ ] **Step 5: Commit** `feat: home layout A`

### Task 4: Adicionar por gaveta e formulário curto

**Files:**

- Modify: `src/routes/add.tsx`, `src/routes/new.$category.tsx`

**Interfaces:**

- Consumes: `CATEGORIES`, `DATE_PLACE_CATEGORIES`, `parseTags`, `MediaPicker`, `addItem`.
- Produces: em `new.$category.tsx`, o bloco "Mais detalhes" é `<details>` nativo com `<summary>Mais detalhes</summary>` (acessível de graça); a Tarefa 5 insere o `MusicPicker` no topo quando `meta.key === "music"`.

- [ ] **Step 1:** `/add`: título "O que vamos guardar?", grade de 2 colunas (3 a partir de 640px) com blocos de 96px de altura (ícone/emoji 28px + nome 16px/500), Música primeiro e o resto em ordem de `CATEGORIES`, cada um `Link` para `/new/$category`.
- [ ] **Step 2:** `/new/$category`: visíveis título, `meta.fields[0]`, `MediaPicker` (só foto; o áudio vai para "Mais detalhes" em música), status em selos (se houver) e "Guardar"; dentro de `<details>`: motivo, observações, tags, nota, data/lugar (`DATE_PLACE_CATEGORIES`), favorito. O `submit` salva os mesmos campos de hoje.
- [ ] **Step 3: Verificação:** criar um presente só com título → aparece no Início; criar outro abrindo "Mais detalhes" e preenchendo tags e nota → aparecem no item. `npx vitest run` PASS.
- [ ] **Step 4: Commit** `feat: add by drawer with short forms`

### Task 5: Música por busca ou link

**Files:**

- Create: `src/lib/music-link.ts`, `src/lib/music-link.test.ts`, `src/components/music-picker.tsx`
- Delete: `src/components/music-search.tsx`
- Modify: `src/routes/new.$category.tsx`

**Interfaces:**

- Consumes: `searchTracks`, `TrackResult` (`src/lib/music-search.ts`), `extractYouTubeId`, `getYouTubeThumbnail`.
- Produces:
  - `type MusicLink = { kind: "youtube"; id: string; url: string } | { kind: "spotify"; id: string; url: string } | { kind: "spotify-other"; url: string }`
  - `parseMusicLink(input: string): MusicLink | null`
  - `spotifyTrackId(url?: string | null): string | null` (usado na Tarefa 6)
  - `resolveMusicLink(link: MusicLink, signal?: AbortSignal): Promise<TrackResult>` — YouTube: `https://www.youtube.com/oembed?url=<url>&format=json` → `{ title, artist: author_name, artwork: getYouTubeThumbnail(id, "hq"), previewUrl: url, link: url }`; se falhar, `{ title: "", artist: "", artwork: miniatura, previewUrl: url, link: url }`. Spotify: `https://open.spotify.com/oembed?url=<url>` → `{ title, artist: "", artwork: thumbnail_url, previewUrl: "https://open.spotify.com/track/<id>", link: url }`; se falhar, mesmo sem título.
  - `<MusicPicker onPick={(t: TrackResult) => void} />`

- [ ] **Step 1: Testes**

```ts
it.each([
  ["https://youtu.be/dQw4w9WgXcQ", { kind: "youtube", id: "dQw4w9WgXcQ" }],
  [
    "https://open.spotify.com/intl-pt/track/4uLU6hMCjMI75M1A2tKUQC?si=abc",
    { kind: "spotify", id: "4uLU6hMCjMI75M1A2tKUQC" },
  ],
  ["spotify:track:4uLU6hMCjMI75M1A2tKUQC", { kind: "spotify", id: "4uLU6hMCjMI75M1A2tKUQC" }],
  ["https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX", { kind: "spotify-other" }],
])("parseMusicLink(%s)", (input, want) => expect(parseMusicLink(input)).toMatchObject(want));
it("plain text is not a link", () => expect(parseMusicLink("chet baker")).toBeNull());
it("youtube oEmbed fills title and artist", async () => {
  /* fetch mock → {title:"Never Gonna…", author_name:"Rick Astley"} */
  expect(await resolveMusicLink(parseMusicLink("https://youtu.be/dQw4w9WgXcQ")!)).toMatchObject({
    title: "Never Gonna…",
    artist: "Rick Astley",
    artwork: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  });
});
it("dead youtube video still resolves with thumbnail and empty title", async () => {
  /* fetch → 404 */
  expect(await resolveMusicLink(parseMusicLink("https://youtu.be/kYJqUf7D70A")!)).toMatchObject({
    title: "",
    previewUrl: "https://youtu.be/kYJqUf7D70A",
  });
});
it("spotify oEmbed fills title and cover; preview is the track URL", async () => {
  /* fetch → {title:"Never Gonna Give You Up", thumbnail_url:"https://img/x"} */
  expect(
    await resolveMusicLink(parseMusicLink("spotify:track:4uLU6hMCjMI75M1A2tKUQC")!),
  ).toMatchObject({
    title: "Never Gonna Give You Up",
    artwork: "https://img/x",
    previewUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/music-link.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `music-link.ts`. `MusicPicker`: um campo de 56px com `autoFocus` e o texto "Busque pelo nome ou cole um link"; se `parseMusicLink` reconhecer, resolve o link (`spotify-other` mostra "Esse link é de álbum ou playlist. Cole o link de uma música."); senão, busca no iTunes como hoje (300ms, abort). Ao escolher, mostra um cartão de confirmação com capa e título/artista editáveis e o botão "Guardar música", que chama `onPick`. Em `new.$category.tsx` (música), `onPick` preenche `title`, `subtitle` (= artista), `imageUrl`, `audioUrl` (= `previewUrl`), `link` e envia o formulário.
- [ ] **Step 4:** `npx vitest run` PASS. Navegador: colar `https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC` → aparece "Never Gonna Give You Up" com capa → "Guardar música" → item criado; repetir com um link do YouTube e com uma busca por nome.
- [ ] **Step 5: Commit** `feat: add music by search or YouTube/Spotify link`

### Task 6: Player — modo Spotify, anterior/próxima e giro

**Files:**

- Create: `src/lib/spotify.ts`, `src/lib/queue.ts`, `src/lib/queue.test.ts`, `src/lib/player-source.test.ts`
- Modify: `src/lib/player-context.tsx`, `src/routes/__root.tsx` (contêiner persistente `#archive-spotify-player` ao lado do do YouTube)

**Interfaces:**

- Consumes: `spotifyTrackId` (Tarefa 5), `useArchive().items`.
- Produces:
  - `type PlayerSource = "youtube" | "spotify" | "audio" | "synth"`; `sourceFor(item: Item): PlayerSource` (ordem: YouTube por `audioUrl`/`link`, Spotify por `audioUrl`/`link`, `audio` se houver `audioUrl`, senão `synth`).
  - `nextMusicTrack(items: Item[], currentId: string | null, dir: 1 | -1): Item | null` — percorre só itens `category === "music"` que tenham `audioUrl` ou `link`, na ordem de `items`, dando a volta.
  - `loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI>` (script `https://open.spotify.com/embed/iframe-api/v1`, callback `window.onSpotifyIframeApiReady`, carregado uma vez).
  - `usePlayer()` ganha `source: PlayerSource`, `playNext(): void`, `playPrev(): void`; `isYouTube`/`youtubeId` continuam (compatibilidade).

- [ ] **Step 1: Testes**

```ts
it("sourceFor picks spotify for a spotify track link", () =>
  expect(
    sourceFor({ ...base, audioUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" }),
  ).toBe("spotify"));
it("sourceFor prefers youtube, then audio, then synth", () => {
  expect(sourceFor({ ...base, link: "https://youtu.be/dQw4w9WgXcQ" })).toBe("youtube");
  expect(sourceFor({ ...base, audioUrl: "https://a/x.m4a" })).toBe("audio");
  expect(sourceFor(base)).toBe("synth");
});
it("nextMusicTrack wraps and skips non-music/unplayable", () => {
  const list = [m("a"), note("n"), m("b"), mNoAudio("c")];
  expect(nextMusicTrack(list, "b", 1)!.id).toBe("a");
  expect(nextMusicTrack(list, "a", -1)!.id).toBe("b");
  expect(nextMusicTrack([], null, 1)).toBeNull();
});
```

Teste de troca de fonte (Review Focus 5), em `player-source.test.ts` com jsdom, `loadYouTubeIframeAPI`/`loadSpotifyIframeApi` mockados e controladores falsos: tocar um item Spotify e depois um do YouTube → `spotifyController.pause` foi chamado; o inverso → `ytPlayer.pauseVideo` foi chamado.

- [ ] **Step 2:** `npx vitest run src/lib/queue.test.ts src/lib/player-source.test.ts` → FAIL.
- [ ] **Step 3:** Implementar. Spotify: `IFrameAPI.createController(el, { uri: "spotify:track:<id>", width: "100%", height: 152 }, cb)`; `controller.addListener("playback_update", e => …)` alimenta `isPlaying = !e.data.isPaused`, `currentTime = position/1000`, `duration = duration/1000`; tocar/pausar/seek via `controller.resume/pause/seek(seconds)`, trocar faixa via `controller.loadUri` + `controller.play()`. Ao trocar de fonte, pausar a anterior (YouTube `pauseVideo`, `<audio>.pause()`, Spotify `pause`, sintetizador `stop`). Volume e RPM não se aplicam ao Spotify (os controles ficam desabilitados nesse modo). O contêiner Spotify em `__root.tsx` fica fixo e oculto (`opacity:0; pointer-events:none`), e a Tarefa 7 o reposiciona visível dentro do player grande.
- [ ] **Step 4:** `npx vitest run` PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** `feat: spotify playback, next/previous`

### Task 7: Player visual (capa + vinil), mini player e "Tocando agora"

**Files:**

- Create: `src/components/player.tsx`, `src/components/player.test.tsx`, `src/components/now-playing.tsx`
- Delete: `src/components/turntable.tsx`
- Modify: `src/components/mini-player.tsx`, `src/routes/__root.tsx` (`TurntableModal` → `PlayerModal`), `src/routes/c.$category.tsx` (troca `<Turntable>` por `<NowPlaying />`), `src/styles.css` (`@keyframes vinyl-spin`, utilitário `vinyl`)

**Interfaces:**

- Consumes: `usePlayer()` com `source`, `playNext`, `playPrev` (Tarefa 6); `useArchive().device.animations` (Tarefa 1).
- Produces: `<Player onClose={() => void} />`, `<NowPlaying />`, `<MiniPlayer />`.

- [ ] **Step 1: Teste**

```tsx
// player.test.tsx: renderToString com usePlayer/useArchive mockados
it("vinyl spins only while playing", () => {
  playerState.isPlaying = true;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="true"/);
  playerState.isPlaying = false;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="false"/);
});
it("animations off on this device stops the vinyl", () => {
  playerState.isPlaying = true;
  device.animations = false;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="false"/);
});
```

- [ ] **Step 2:** `npx vitest run src/components/player.test.tsx` → FAIL.
- [ ] **Step 3:** Implementar o visual do spec (esboço B aprovado): capa quadrada (até 240px, raio 16px, sombra) com o vinil saindo à direita (círculo ~90% da capa, sulcos em `repeating-radial-gradient`, rótulo central com a capa); o vinil tem `data-spinning` e o CSS `[data-spinning="true"] { animation: vinyl-spin 4s linear infinite }`. Pausar congela o ângulo com `animation-play-state: paused`, e a classe permanece. Isso fica fora da regra de `prefers-reduced-motion`, mas obedece a `[data-anim="false"]`. Embaixo: título 20px/600, artista 16px suave, barra de progresso (`seek`), botões anterior/tocar-pausar (56px)/próxima, volume (desabilitado no Spotify) e RPM discreto. Quando `source === "spotify"`, o `#archive-spotify-player` fica visível dentro do player, abaixo da capa. `MiniPlayer`: linha fixa acima do menu (capa 44px, título, tocar/pausar 44px), toque abre o grande. `NowPlaying`: cartão compacto no topo de `/c/music` (faixa atual ou a primeira da gaveta, botão tocar, abre o grande).
- [ ] **Step 4:** `npx vitest run` PASS. Navegador: tocar uma prévia do iTunes → disco gira; pausar → para no ângulo; fechar o player → mini player continua e a música segue; tocar um item Spotify → embed aparece no player e o disco gira com o play do embed; próxima/anterior trocam de faixa.
- [ ] **Step 5: Commit** `feat: cover + vinyl player`

### Task 8: Gaveta, item, busca, favoritos e lembranças

**Files:**

- Modify: `src/routes/c.$category.tsx`, `src/routes/item.$id.tsx`, `src/routes/search.tsx`, `src/routes/favorites.tsx`, `src/routes/box.tsx`, `src/components/page-header.tsx`, `src/components/archive-ui.tsx` (remover `ItemCard`, `RetroClock`, `Chip` se não usados)

**Interfaces:**

- Consumes: `ItemRow` (Tarefa 3), `NowPlaying` (Tarefa 7), utilitários da Tarefa 2.

- [ ] **Step 1:** `PageHeader`: botão voltar com ícone `ChevronLeft` (44px) + título 30px/700 + subtítulo 16px suave; sem kaomoji no cabeçalho.
- [ ] **Step 2:** Gaveta: `NowPlaying` em Música, filtros de status em selos, lista de `ItemRow`; as visões grade e cassete saem; vazio → `EmptyDrawer` com ação "Adicionar" para `/new/<gaveta>`.
- [ ] **Step 3:** Item: capa grande (até 280px, raio 16px), título 30px, detalhe, ações em botões de 44px com ícone e texto (Tocar, Favoritar, Trocar foto, Apagar), observações editáveis; campos (motivo, data, lugar, tags, nota, status) só quando preenchidos; "Transformar em ideia de presente" continua em "Coisa que ele disse".
- [ ] **Step 4:** Busca: campo de 52px com `autoFocus`, filtros em selos, resultados agrupados por gaveta com `ItemRow`. Favoritos e Lembranças: mesmo estilo.
- [ ] **Step 5: Verificação:** `npx vitest run` PASS; navegador a 375px e a 1280px nas 5 telas, sem rolagem lateral, no tema `noite` e no `algodao`.
- [ ] **Step 6: Commit** `feat: restyle drawer, item, search, favorites, box`

### Task 9: Ajustes

**Files:**

- Modify: `src/routes/settings.tsx`

**Interfaces:**

- Consumes: `THEMES` (Tarefa 1), `useArchive().device/updateDevice`, `SyncSection`, `parseBackup`.

- [ ] **Step 1:** Seções na ordem: "Seu tema" (cartões de 2 colunas com prévia: fundo, uma linha de texto e um ponto da cor de destaque; o nome do tema; selecionado com borda `--primary` de 2px; legenda "Só neste aparelho"); "Arquivo" (nome do arquivo, frase favorita, como chamar a pessoa: `archiveName`, `favoriteQuote`, `personName`); "Animações" (interruptor → `updateDevice({ animations })`); "Sincronizar na nuvem" (`SyncSection` como está); "Backup" (exportar, restaurar e apagar tudo, como hoje).
- [ ] **Step 2:** Remover o editor MySpace, as abas, `WALLPAPERS`, `FONTS`, `BORDERS`, `DEFAULT_CUSTOM_THEME`, a matiz e os interruptores `decorations`/`privacy`.
- [ ] **Step 3: Verificação:** trocar de tema reflete na hora e não muda o tema em outro aparelho (abrir outra janela anônima logada: o tema dela não muda). `npx vitest run` PASS.
- [ ] **Step 4: Commit** `feat: simpler settings with per-device theme`

### Task 10: Limpeza e verificação final

**Files:**

- Modify: `src/styles.css`, `src/components/archive-ui.tsx`, qualquer arquivo com sobras

- [ ] **Step 1:** `grep -rnE "font-mono|font-hand|font-pixel|font-serif|uppercase|tracking-\[|anim-in|polaroid|label-chip|card-object|grain" src --include=*.tsx` → nenhum resultado (ou só onde o spec permite). Remover os utilitários CSS que ficaram sem uso.
- [ ] **Step 2:** `npx tsc --noEmit`, `npx eslint .` (0 erros), `npx vitest run` (tudo PASS), `npm run build`.
- [ ] **Step 3: Verificação no navegador:** nas rotas `/`, `/add`, `/new/music`, `/new/gift`, `/c/music`, `/item/<id>`, `/search`, `/favorites`, `/box`, `/settings`, em 375px e 1280px, nos 6 temas: sem rolagem lateral (`scrollWidth - clientWidth === 0`), sem erro no console, foco visível com Tab, menu de baixo legível.
- [ ] **Step 4: Commit** `chore: remove old visual leftovers`
