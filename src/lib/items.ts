import type { Category } from "./categories";

export type Item = {
  id: string;
  category: Category;
  title: string;
  subtitle?: string | undefined;
  notes?: string | undefined;
  reason?: string | undefined;
  status?: string | undefined;
  rating?: number | undefined;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  date?: string | undefined;
  place?: string | undefined;
  link?: string | undefined;
  image?: string | undefined;
  audioUrl?: string | undefined;
  coverStyle?: "vinyl" | "cassette" | "cd" | "polaroid" | undefined;
};

export const ITEMS_KEY = "archive.items.v1";

export function hasStoredItems(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ITEMS_KEY) !== null;
}

export function loadItems(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ITEMS_KEY) ?? "[]") as Item[];
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("Storage quota warning, keeping inline content safe:", err);
    try {
      // In case quota is tightly exceeded, prune only excessively huge dataUrls (> 500kb)
      const stripped = items.map((it) => {
        const clone = { ...it };
        if (clone.image && clone.image.length > 500000) delete clone.image;
        if (clone.audioUrl && clone.audioUrl.length > 500000) delete clone.audioUrl;
        return clone;
      });
      localStorage.setItem(ITEMS_KEY, JSON.stringify(stripped));
    } catch (err2) {
      console.error("Critical: Could not save items to localStorage", err2);
    }
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

export const seedItems = (): Item[] => {
  let n = 0;
  const now = Date.now();
  const mk = (
    category: Category,
    title: string,
    subtitle: string,
    extra: Partial<Item> = {},
    daysAgo = 0,
  ): Item => ({
    id: `seed-${++n}`,
    category,
    title,
    subtitle,
    tags: [],
    favorite: false,
    createdAt: new Date(now - daysAgo * 86400000).toISOString(),
    ...extra,
  });
  return [
    mk(
      "music",
      "Blue Moon",
      "Chet Baker · jazz",
      {
        favorite: true,
        rating: 5,
        tags: ["nostalgia", "jazz"],
        reason: "ele disse que essa toca na cabeça dele em dias de chuva",
        coverStyle: "vinyl",
        audioUrl: "https://www.youtube.com/watch?v=kYJqUf7D70A",
        image: "https://img.youtube.com/vi/kYJqUf7D70A/hqdefault.jpg",
      },
      2,
    ),
    mk(
      "music",
      "Just Like Heaven",
      "The Cure · pós-punk",
      {
        rating: 4,
        tags: ["rock", "anos80"],
        coverStyle: "cassette",
        audioUrl: "https://www.youtube.com/watch?v=n3nPiBai66M",
        image: "https://img.youtube.com/vi/n3nPiBai66M/hqdefault.jpg",
      },
      6,
    ),
    mk(
      "playlist",
      "our songs",
      "as que a gente escuta no carro",
      { favorite: true, tags: ["fita"], coverStyle: "cassette" },
      9,
    ),
    mk(
      "said",
      "Queria muito ter um toca-discos antigo",
      "conversa de domingo, na cozinha",
      { tags: ["ideias", "presentes"], favorite: true },
      1,
    ),
    mk(
      "gift",
      "Toca-discos vintage",
      "sebo do centro · ~R$ 700",
      { status: "quero comprar", tags: ["presentes"] },
      1,
    ),
    mk(
      "memory",
      "Tarde no mirante",
      "nós dois · céu laranja",
      {
        date: "2026-05-11",
        place: "Mirante do Alto",
        tags: ["memórias"],
        favorite: true,
        coverStyle: "polaroid",
      },
      14,
    ),
    mk(
      "promise",
      "Ver o mar juntos no inverno",
      "para nós",
      { status: "algum dia", tags: ["importante"] },
      20,
    ),
    mk("food", "Café coado sem açúcar", "bebida", { status: "ama" }, 4),
    mk(
      "place",
      "Livraria da esquina",
      "rua das Flores, 121",
      { status: "já fomos", tags: ["memórias"] },
      30,
    ),
  ];
};
