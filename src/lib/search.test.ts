import { expect, it } from "vitest";
import type { Item } from "./items";
import { matchesQuery } from "./search";

const item: Item = {
  id: "a",
  category: "music",
  title: "Blue Moon",
  tags: ["jazz"],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

it("matches tags with # and any case", () => expect(matchesQuery(item, "#JAZZ")).toBe(true));
it("matches title", () => expect(matchesQuery(item, "moon")).toBe(true));
it("rejects non-matching", () => expect(matchesQuery(item, "rock")).toBe(false));
it("blank query matches all", () => expect(matchesQuery(item, "  ")).toBe(true));
