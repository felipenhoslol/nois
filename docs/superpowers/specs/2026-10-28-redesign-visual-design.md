# Redesign visual do Archive — design

Data: 2026-10-28 · Site: https://felpsclaraforever.vercel.app · Código: este repositório (TanStack Start + React 19 + Tailwind 4)

## Por quê

O Archive é o arquivo compartilhado de um casal (Felipe e a namorada): músicas, presentes, memórias, lugares e coisas que um disse para o outro. Funciona, mas não é gostoso de usar. As queixas, nas palavras dele:

- "as coisas parecem muito pequenas", "é tanta opção que às vezes fica meio pequeno, perdido".
- "não gostei muito da fonte".
- "o tema deixa certos textos sem contraste".
- "não é muito prático para colocar músicas". A busca de música já existe, mas "nem percebi": ela some no meio de um formulário longo.
- O toca-discos "é meio feio" e "a animação não funciona".

O sucesso é os dois abrirem o site no celular e acharem, sem pensar, onde adicionar uma música, onde está a última coisa guardada e como tocar uma música.

## Objetivos

1. Tudo maior e mais respirado: menos coisas por tela, hierarquia clara.
2. Uma fonte só: **Outfit** (escolhida por ele), em tamanhos maiores que os de hoje.
3. Tela inicial no "layout A" (escolhido nos esboços): busca, botão Adicionar e os últimos itens guardados.
4. Adicionar começa escolhendo a gaveta. Os formulários mostram só o essencial; o resto fica em "mais detalhes".
5. Música: um campo só, para buscar pelo nome **ou** colar um link do YouTube ou do Spotify, que o site reconhece sozinho.
6. Player novo no estilo "capa + vinil saindo da capa", com o disco girando **só enquanto toca**.
7. Temas revisados: cada um com um visual próprio e coerente com o nome, e todos com contraste legível.
8. Tema por pessoa: ele usa um escuro, ela um claro e rosa, e um não muda o do outro.

## Não objetivos

- Não mudar o banco de dados (tabelas, migrações, regras de acesso). Os itens continuam no mesmo formato (`Item` em `src/lib/items.ts`, guardado como JSON).
- Não apagar funções. Gavetas, favoritos, busca, caixa de lembranças, backup, sincronização e o Ctrl+K continuam, só que reorganizados.
- Não mudar a lógica de sincronização (`src/lib/archive-context.tsx`, `src/lib/sync.ts`).

## Anti-objetivos (seria um fracasso mesmo funcionando)

- Continuar parecendo pequeno ou apertado no celular.
- Algum texto ilegível em algum tema.
- A busca de música continuar difícil de achar.
- Ficar com cara de template genérico: tudo virando cartão igual, rótulos em CAIXA ALTA em cima de cada título, letra mono em todo canto. Hoje o site tem 90 usos de `font-mono`, `uppercase`, `font-hand` e `font-pixel`, e a ideia é sair disso.
- Perder o carinho: o tom em português, com ♡ e kaomoji, fica, só que em menos lugares.

## Decidido com ele

| Assunto                 | Decisão                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tela inicial            | Layout A: saudação + título, busca grande, botão "Adicionar" grande, "Últimos guardados" em linhas grandes com capa, gavetas como atalhos no fim.                   |
| Menu de baixo (celular) | Com ícones (desenho de linha), não só emoji ou texto.                                                                                                               |
| Fonte                   | Outfit.                                                                                                                                                             |
| Temas                   | Base neutra para os dois; ele escolhe um escuro, ela um claro rosa. O editor "MySpace" sai. Cada tema restante é revisado: visual próprio e contraste que funcione. |
| Adicionar               | Abre a escolha de gaveta (todas, não só música).                                                                                                                    |
| Música                  | Buscar pelo nome **ou** colar um link; o site identifica YouTube ou Spotify e preenche sozinho.                                                                     |
| Spotify                 | Toca a prévia (player oficial do Spotify embutido).                                                                                                                 |
| Player                  | Estilo B: capa do álbum com o vinil saindo de dentro dela; o disco gira só enquanto toca.                                                                           |

## Plano visual (frontend-design)

**Ideia central:** o arquivo é um lugar calmo e grande, e a única peça com brilho é o disco. Toda a ousadia vai para o player (capa + vinil). O resto fica quieto: fundo liso, uma fonte, poucos cantos arredondados e nenhuma decoração que não diga algo.

**Tipografia (Outfit, uma família só):**

| Papel            | Tamanho / peso                                               |
| ---------------- | ------------------------------------------------------------ |
| Título da tela   | 30px / 700, entrelinha 1.1                                   |
| Título de seção  | 20px / 600                                                   |
| Título de item   | 17px / 500                                                   |
| Corpo e campos   | 16px / 400 (campos sempre ≥16px, para o iPhone não dar zoom) |
| Texto secundário | 14px / 400                                                   |
| Menor permitido  | 13px (só legendas do menu de baixo)                          |

Regras: sem CAIXA ALTA em rótulo, sem letra mono, sem fonte manuscrita ou pixel. Nome e frase do arquivo em Outfit. Metadados não usam "A · B": vão em duas linhas, ou com a gaveta como um pequeno selo.

**Temas.** Cada tema define as mesmas variáveis que existem hoje em `src/styles.css` (`--background`, `--card`, `--foreground`, `--muted-foreground`, `--primary`, `--primary-foreground`, `--border`, etc.). A proposta abaixo tem 6 temas, cada um com um motivo de existir (minha proposta; ver "Calls"):

| Chave     | Nome na tela | Clima                                   | Fundo   | Superfície | Texto   | Texto suave | Destaque |
| --------- | ------------ | --------------------------------------- | ------- | ---------- | ------- | ----------- | -------- |
| `noite`   | Noite        | escuro azulado (o dele)                 | #14161D | #1D2029    | #ECEDF2 | #A3A8B6     | #8FB3FF  |
| `algodao` | Algodão-doce | claro rosa (o dela)                     | #FFF5F7 | #FFFFFF    | #3A2230 | #7A5566     | #D6336C  |
| `fita`    | Fita verde   | claro, verde-sálvia de fita antiga      | #EEF1E8 | #FAFBF6    | #22281F | #59614F     | #3D6B4C  |
| `hifi`    | Hi-Fi        | escuro quente, âmbar de aparelho de som | #1B1714 | #27211C    | #F2EADF | #B8AA98     | #E8A04B  |
| `vhs`     | VHS          | escuro roxo de fita de vídeo            | #17121F | #231A2F    | #EFE7F8 | #B3A6C6     | #C69BFF  |
| `ceu`     | Céu          | claro azul, neutro                      | #F2F6FB | #FFFFFF    | #1E2A3A | #556377     | #2F6FD6  |

Esses valores são o ponto de partida. A regra que manda: **todo par de texto e fundo precisa ter contraste de pelo menos 4,5:1** (texto, texto suave, destaque usado como texto, texto do botão sobre o destaque). Elementos grandes e ícones precisam de pelo menos 3:1. Se um valor da tabela não passar, ajuste o valor e mantenha o clima.

**Layout:**

```
Celular (até 767px)                 Computador (768px+)
┌─────────────────────────┐         ┌──────────┬──────────────────────┐
│ oi, vocês dois ♡        │         │ Archive  │ (mesma coluna do     │
│ Nosso arquivo           │         │ ⌂ Início │  celular, até 640px, │
│ [⌕ procurar...       ]  │         │ ♪ Músicas│  centralizada)       │
│ [   ＋ Adicionar      ]  │         │ ♡ Favor. │                      │
│ Últimos guardados       │         │ ⚙ Ajustes│                      │
│ [capa] Título           │         │ [＋ Adic]│                      │
│        detalhe          │         │ Ctrl K   │                      │
│ ...                     │         └──────────┴──────────────────────┘
│ Gavetas: 🎵 🎁 📸 mais  │
│ [mini player]           │
├─────────────────────────┤
│ ⌂    ♪    ＋    ♡    ⚙  │  ← menu de baixo com ícones
└─────────────────────────┘
```

- Tudo alinhado à esquerda. Coluna única de até 640px. Margem lateral de 20px no celular.
- Alvo de toque mínimo de 44px; linhas de item com pelo menos 64px de altura.
- Cantos: 16px para blocos grandes (linhas, campos, botão Adicionar), 999px para selos. Não usar o mesmo raio em tudo.
- Sombra só no player e no mini player. O resto se separa por cor de superfície e borda de 1px.

**Movimento:** o disco gira só enquanto toca. Abrir o player, a lista de gavetas e o "mais detalhes" pode ter uma transição curta que mostre o que abriu. As entradas animadas em cada cartão (`anim-in`) saem.

## As telas

1. **Início (`/`):**
   - Saudação curta e o nome do arquivo (`settings.archiveName`), com a frase favorita embaixo, em texto suave.
   - Busca: tocar nela abre `/search` já com o cursor no campo.
   - Botão "Adicionar" → `/add`.
   - "Últimos guardados": os 6 mais recentes, em linhas com capa (ou o ícone da gaveta), título e detalhe.
   - Gavetas: atalhos em selos, em uma ou duas linhas, com "todas" levando à lista completa.
   - O polaroid grande, o relógio retrô e os contadores atuais saem.
   - Um link discreto para "Lembranças" (`/box`).
2. **Menu de baixo (celular):** Início, Músicas (`/c/music`), Adicionar (botão do meio, destacado), Favoritos e Ajustes. Ícones de linha com legenda de 13px. A busca sai do menu, porque fica no topo do Início, e "Lembranças" sai do menu. Barra lateral (computador): os mesmos itens, mais o botão Ctrl+K que já existe.
3. **Adicionar (`/add`):** grade de gavetas em blocos grandes (ícone + nome), duas colunas no celular. Música aparece primeiro; o resto na ordem de `CATEGORIES`. Tocar abre `/new/<gaveta>`.
4. **Formulário de nova coisa (`/new/<gaveta>`):**
   - Visível: título, o campo principal da gaveta (`meta.fields[0]`), a foto, o status (se a gaveta tiver) e o botão "Guardar".
   - Fechado em "Mais detalhes": motivo, observações, tags, nota (estrelas), data e lugar (onde se aplicam) e favorito.
   - O formulário salva os mesmos campos de hoje.
5. **Nova música (`/new/music`):**
   - Topo: um campo grande com o cursor já nele, com o texto "Busque pelo nome ou cole um link".
   - Se for um nome: a busca do iTunes que já existe (`src/lib/music-search.ts`), com os resultados em linhas grandes com capa.
   - Se for um link do YouTube: reconhece o vídeo (`extractYouTubeId`), usa a miniatura como capa e tenta puxar o título.
   - Se for um link do Spotify (faixa): reconhece e puxa título e capa pelo oEmbed público do Spotify.
   - Escolhido o resultado, aparece um cartão de confirmação (capa, título, artista, editáveis) e o botão "Guardar música". O resto fica em "Mais detalhes", como nas outras gavetas.
   - Onde guardar: `audioUrl` recebe o que toca (prévia do iTunes, link do YouTube ou link do Spotify), `link` recebe a página original e `image` recebe a capa. Nenhum campo novo no banco.
6. **Gaveta (`/c/<gaveta>`):** título grande, filtros de status em selos e a lista em linhas grandes. As visões "grade" e "cassete" saem; fica uma só. Em Música, o player fica no topo da tela.
7. **Item (`/item/<id>`):** capa grande, título, detalhe, ações (tocar, favoritar, editar foto/áudio, apagar) e as observações. Os demais campos aparecem só quando estão preenchidos.
8. **Busca, Favoritos, Lembranças:** mesmo estilo de linhas grandes. A lógica fica como está.
9. **Ajustes:**
   - Seções: "Seu tema" (cartões com prévia dos 6 temas), "Arquivo" (nome, frase, nome da pessoa), "Animações" (ligar e desligar), "Sincronizar na nuvem" (como está) e "Backup".
   - Saem: o editor MySpace, a escolha de fundo (wallpaper), a matiz manual (`hue`) e os interruptores `decorations` e `privacy`, que não fazem nada visível hoje.
   - Os campos continuam no tipo `Settings`, para não quebrar backups antigos; só a tela deixa de mostrá-los.
10. **Player:**
    - **Grande** (abre do mini player ou de "Tocar"): capa do álbum em destaque, com o vinil saindo de dentro dela e girando enquanto `isPlaying` for verdadeiro. Pausou, ele para no ângulo em que estava. Embaixo: título, artista, barra de progresso, anterior / tocar-pausar / próxima e volume. O seletor 33/45 RPM pode ficar, discreto.
    - **Mini player:** linha fixa acima do menu de baixo, com capa, título e tocar/pausar. Tocar nela abre o grande.
    - **Spotify:** usa o player embutido oficial (`open.spotify.com/embed/track/<id>`); ver call 8.

## Restrições

- Mesma base de código, rotas e dados. Usar o que já existe: `useArchive`, `usePlayer`, `CATEGORIES`, `searchTracks`, `extractYouTubeId` e o componente de comando do Ctrl+K.
- Os 51 testes atuais continuam passando. Lógica nova (reconhecer link, tema por pessoa, contraste) ganha teste.
- Sem rolagem lateral de 375px a 1280px. Foco do teclado visível. Animações desligáveis nos Ajustes.
- Carregar só a Outfit do Google Fonts (pesos 400, 500, 600 e 700) e tirar as outras 4 famílias do `<head>`.

## Calls (decisões minhas, para ele conferir)

1. **Tema por aparelho:** o tema fica salvo no aparelho (`localStorage`, chave nova `archive.device.v1`, ver call 11) e não é sincronizado, porque cada um usa o próprio celular e assim não se mexe no banco. O resto das configurações continua compartilhado. Temas antigos são convertidos na primeira abertura: `darkvintage` e `computer` → `noite`, `soft` e `y2k` → `algodao`, `cassette` e `cozy` → `fita`, `hifi` → `hifi`, `vhs` → `vhs`, `custom` → `noite`.
2. **De 8 para 6 temas**, com os valores da tabela acima. Tema padrão para quem nunca escolheu: `ceu` (neutro).
3. **Adicionar no meio do menu de baixo**, além do botão grande no Início, porque nas outras telas não haveria outro jeito rápido de adicionar.
4. **Busca e Lembranças saem do menu de baixo:** a busca fica no topo do Início, e Lembranças vira link no Início.
5. **Uma visão por gaveta** (lista). Grade e cassete saem.
6. **Giro do disco e o "reduzir movimento" do Windows:** hoje o site desliga toda animação quando essa opção do sistema está ligada, o que provavelmente é o "não funciona". O disco passa a girar mesmo assim, devagar (uma volta a cada ~4s), porque só gira depois de um toque em "tocar". O interruptor "Animações" dos Ajustes continua parando tudo, inclusive o disco.
7. **Kaomoji e ♡** só em estados vazios, na saudação e nas mensagens de confirmação.
8. **Spotify continua tocando com o player grande fechado.** O embed do Spotify fica num contêiner que nunca sai da tela, igual ao do YouTube em `__root.tsx` (`archive-yt-player-container`), e é controlado pela Spotify IFrame API (`loadUri`, `togglePlay`, `seek` e o evento `playback_update`). Vira um quarto modo em `usePlayer`, ao lado de YouTube, `<audio>` e sintetizador. Assim mini player, pausar, barra de progresso e o giro do disco funcionam igual para Spotify. No player grande o embed aparece visível, posicionado onde fica o controle. Fechado o player, ele continua montado, só que oculto.
9. **Topo de `/c/music`:** um cartão compacto "Tocando agora", com capa pequena, título e tocar/pausar, que abre o player grande. Não é uma segunda cópia do player: existe um player grande só (sobreposto), e por isso nunca há dois iframes tocando.
10. **Gavetas no Início:** aparecem como selos as gavetas que têm itens, ordenadas pela quantidade (no máximo 6), e depois um selo "Todas as gavetas", que abre a lista completa ali mesmo, sem rota nova. Cada selo leva a `/c/<gaveta>`. Num arquivo vazio, aparecem Música, Presente e Memória.
11. **"Animações" também por aparelho**, como o tema, para um não desligar o giro do disco do outro. O valor vai para o `localStorage` (`archive.device.v1`, junto com o tema: `{ theme, animations }`). Na primeira abertura, o valor atual de `settings.animations` é copiado para lá.

## O que fica com o builder

- Ícones: usar `lucide-react`, que já está instalado.
- Título de link do YouTube: o oEmbed do YouTube pode não aceitar chamadas do navegador. Se não aceitar, usar a miniatura e deixar o título para a pessoa digitar (o campo já vem focado).
- Detalhes de espaçamento, transições e os textos exatos dos botões, seguindo o tom: português, frases curtas, verbos claros ("Guardar música", "Adicionar", "Procurar").
- Como dividir os componentes.
