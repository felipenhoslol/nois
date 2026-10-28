import type { Item } from "./items";

export type Category =
  | "music"
  | "playlist"
  | "brand"
  | "clothes"
  | "gift"
  | "food"
  | "film"
  | "anime"
  | "game"
  | "book"
  | "place"
  | "said"
  | "memory"
  | "promise"
  | "note";

export type CategoryMeta = {
  key: Category;
  label: string;
  emoji: string;
  kaomoji: string;
  plural: string;
  empty: string;
  statuses?: string[];
  fields?: { key: keyof Item; label: string; placeholder?: string }[];
};

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "music",
    label: "Música",
    emoji: "🎵",
    kaomoji: "( ˘ ³˘)♬",
    plural: "músicas",
    empty: "Nenhuma faixa gravada nesta fita ainda ♡",
    fields: [{ key: "subtitle", label: "Artista / álbum" }],
  },
  {
    key: "playlist",
    label: "Playlist",
    emoji: "📼",
    kaomoji: "(◕‿◕)♫",
    plural: "playlists",
    empty: "Nenhuma fita montada ainda ♡",
    fields: [{ key: "subtitle", label: "Descrição" }],
  },
  {
    key: "brand",
    label: "Marca",
    emoji: "🏷️",
    kaomoji: "( ˘ᴗ˘ )✦",
    plural: "marcas",
    empty: "Nenhuma etiqueta colada aqui ainda ♡",
    fields: [{ key: "subtitle", label: "Categoria (tênis, tech...)" }],
  },
  {
    key: "clothes",
    label: "Roupa",
    emoji: "👕",
    kaomoji: "(✿◠‿◠)",
    plural: "peças",
    empty: "O guarda-roupa ainda está vazio ♡",
    statuses: ["já tem", "gostaria de ter", "look"],
    fields: [{ key: "subtitle", label: "Marca / tipo / cor" }],
  },
  {
    key: "gift",
    label: "Presente",
    emoji: "🎁",
    kaomoji: "(づ｡◕‿◕｡)づ",
    plural: "presentes",
    empty: "Nenhuma ideia guardada ainda ♡",
    statuses: ["ideia", "pesquisando", "quero comprar", "comprado", "entregue"],
    fields: [{ key: "subtitle", label: "Loja / preço aproximado" }],
  },
  {
    key: "food",
    label: "Comida",
    emoji: "🍜",
    kaomoji: "(๑´ڡ`๑)",
    plural: "sabores",
    empty: "Nada no cardápio ainda ♡",
    statuses: ["ama", "gosta", "talvez", "não gosta", "quer provar"],
    fields: [{ key: "subtitle", label: "Tipo (bebida, sobremesa...)" }],
  },
  {
    key: "film",
    label: "Filme/Série",
    emoji: "🎬",
    kaomoji: "( ๑ ❛ ᴗ ❛ ๑ )",
    plural: "títulos",
    empty: "A fita ainda não foi rebobinada ♡",
    statuses: ["quero assistir", "assistindo", "terminado", "assistimos juntos"],
    fields: [{ key: "subtitle", label: "Gênero" }],
  },
  {
    key: "anime",
    label: "Anime/Mangá",
    emoji: "🌙",
    kaomoji: "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
    plural: "obras",
    empty: "Nenhum volume nesta prateleira ainda ♡",
    statuses: ["quero assistir", "assistindo", "terminado", "favorito"],
    fields: [{ key: "subtitle", label: "Gênero / estúdio" }],
  },
  {
    key: "game",
    label: "Jogo",
    emoji: "🕹️",
    kaomoji: "( •̀ ᴗ •́ )و",
    plural: "jogos",
    empty: "Insira uma ficha para começar ♡",
    statuses: ["quer jogar", "jogando", "zerado", "jogamos juntos"],
    fields: [{ key: "subtitle", label: "Plataforma / gênero" }],
  },
  {
    key: "book",
    label: "Livro",
    emoji: "📖",
    kaomoji: "( ˶ᵔ ᵕ ᵔ˶ )",
    plural: "livros",
    empty: "A estante ainda está vazia ♡",
    statuses: ["quer ler", "lendo", "lido", "favorito"],
    fields: [{ key: "subtitle", label: "Autor" }],
  },
  {
    key: "place",
    label: "Lugar",
    emoji: "📍",
    kaomoji: "(｡♥‿♥｡)",
    plural: "lugares",
    empty: "Nenhum destino marcado no mapa ainda ♡",
    statuses: ["ele gosta", "já fomos", "quer conhecer", "quero levá-lo"],
    fields: [{ key: "subtitle", label: "Endereço / cidade" }],
  },
  {
    key: "said",
    label: "Coisa que ele disse",
    emoji: "💬",
    kaomoji: "( ˘͈ ᵕ ˘͈ )",
    plural: "comentários",
    empty: "Talvez ele mencione algo que você queira guardar aqui ♡",
    fields: [{ key: "subtitle", label: "Contexto (onde, quando)" }],
  },
  {
    key: "memory",
    label: "Memória",
    emoji: "📸",
    kaomoji: "( ˶ˆᗜˆ˵ )",
    plural: "memórias",
    empty: "Esta gaveta de fotos ainda está vazia ♡",
    fields: [{ key: "subtitle", label: "Pessoas / música do dia" }],
  },
  {
    key: "promise",
    label: "Promessa",
    emoji: "🫶",
    kaomoji: "(っ˘з(˘⌣˘ )",
    plural: "promessas",
    empty: "Nenhum bilhete dentro da caixa ainda ♡",
    statuses: ["promessa nossa", "promessa pessoal", "algum dia", "cumprida"],
    fields: [{ key: "subtitle", label: "Para quem" }],
  },
  {
    key: "note",
    label: "Nota",
    emoji: "⭐",
    kaomoji: "( ｡•́‿•̀｡)",
    plural: "notas",
    empty: "Nenhuma anotação solta ainda ♡",
    fields: [{ key: "subtitle", label: "Assunto" }],
  },
];

export const catMeta = (key: string): CategoryMeta =>
  (CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1])!;

// Categories whose form shows the Date + Place fields.
export const DATE_PLACE_CATEGORIES: Category[] = ["memory", "promise", "said", "place"];
