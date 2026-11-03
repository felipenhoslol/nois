import { describe, it, expect } from "vitest";
import { CATEGORIES, type Category } from "./categories";
import type { Item } from "./items";
import { pickHomeDrawers } from "./home";

const base: Item = {
  id: "x",
  category: "note",
  title: "t",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01",
};
const mk = (category: Category): Item => ({ ...base, id: Math.random().toString(), category });

describe("pickHomeDrawers", () => {
  it("orders drawers by how many items they have, max 6", () => {
    const items = [mk("food"), mk("food"), mk("music"), mk("gift"), mk("gift"), mk("gift")];
    expect(pickHomeDrawers(items).map((c) => c.key)).toEqual(["gift", "food", "music"]);
  });
  it("ties keep CATEGORIES order", () =>
    expect(pickHomeDrawers([mk("book"), mk("music")]).map((c) => c.key)).toEqual([
      "music",
      "book",
    ]));
  it("caps at max", () => expect(pickHomeDrawers(CATEGORIES.map((c) => mk(c.key))).length).toBe(6));
  it("empty archive shows music, gift, memory", () =>
    expect(pickHomeDrawers([]).map((c) => c.key)).toEqual(["music", "gift", "memory"]));
});
