import { beforeEach, expect, it, vi } from "vitest";
import type { Item } from "./items";

const db = vi.hoisted(() => ({ upsert: vi.fn(), rows: [] as unknown[] }));
vi.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => ({
      upsert: (rows: unknown) => {
        db.upsert(table, rows);
        return Promise.resolve({ error: null });
      },
      select: () =>
        table === "items"
          ? Promise.resolve({ data: db.rows, error: null })
          : { eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) },
    }),
  },
}));

const base: Item = {
  id: "a",
  category: "note",
  title: "segredo",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  db.upsert.mockReset();
  db.rows = [];
});

it("upload sends the private flag as a column and keeps ownerId out of the stored data", async () => {
  const { upsertItems } = await import("./sync");
  await upsertItems("u1", [{ ...base, private: true, ownerId: "u1" }]);
  const [table, rows] = db.upsert.mock.calls[0]!;
  expect(table).toBe("items");
  expect(rows[0]).toMatchObject({ id: "a", user_id: "u1", private: true });
  expect(rows[0].data).not.toHaveProperty("ownerId");
  expect(rows[0]).not.toHaveProperty("owner_id"); // the database sets the owner, never the client
});

it("items without the flag upload as shared", async () => {
  const { upsertItems } = await import("./sync");
  await upsertItems("u1", [base]);
  expect(db.upsert.mock.calls[0]![1][0].private).toBe(false);
});

it("download takes owner and privacy from the columns", async () => {
  db.rows = [{ data: { ...base, private: false }, owner_id: "u2", private: true }];
  const { fetchRemote } = await import("./sync");
  const { items } = await fetchRemote();
  expect(items[0]).toMatchObject({ id: "a", ownerId: "u2", private: true });
});

it("isMine: items without owner (made here, not synced yet) or owned by me", async () => {
  const { isMine } = await import("./items");
  expect(isMine(base, "u1")).toBe(true);
  expect(isMine({ ...base, ownerId: "u1" }, "u1")).toBe(true);
  expect(isMine({ ...base, ownerId: "u2" }, "u1")).toBe(false);
  expect(isMine({ ...base, ownerId: "u2" }, null)).toBe(false);
});
