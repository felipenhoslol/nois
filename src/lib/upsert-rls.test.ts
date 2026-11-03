import { beforeEach, expect, it, vi } from "vitest";
import type { Item } from "./items";

// Each upsert call answers from this queue; a batch call gets the first answer.
const answers = vi.hoisted(() => ({
  queue: [] as { error: { code: string } | null }[],
  calls: [] as string[][],
}));
vi.mock("./supabase", () => ({
  supabase: {
    from: () => ({
      upsert: (rows: { id: string }[]) => {
        answers.calls.push(rows.map((r) => r.id));
        return Promise.resolve(answers.queue.shift() ?? { error: null });
      },
    }),
  },
}));

const mk = (id: string): Item => ({
  id,
  category: "note",
  title: id,
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => {
  answers.queue = [];
  answers.calls = [];
});

it("an item the partner made private doesn't block the rest of the batch", async () => {
  const { upsertItems } = await import("./sync");
  // batch refused by RLS, then one by one: a ok, b refused (now private to the partner)
  answers.queue = [{ error: { code: "42501" } }, { error: null }, { error: { code: "42501" } }];
  await expect(upsertItems("u1", [mk("a"), mk("b")])).resolves.toEqual(["b"]);
  expect(answers.calls).toEqual([["a", "b"], ["a"], ["b"]]);
});

it("other errors (offline etc.) still fail so the batch stays queued", async () => {
  const { upsertItems } = await import("./sync");
  answers.queue = [{ error: { code: "PGRST000" } }];
  await expect(upsertItems("u1", [mk("a"), mk("b")])).rejects.toBeTruthy();
});

it("before the migration runs (no private column), uploads still go through", async () => {
  const { upsertItems } = await import("./sync");
  answers.queue = [{ error: { code: "PGRST204" } }, { error: null }];
  await expect(upsertItems("u1", [mk("a")])).resolves.toEqual([]);
  expect(answers.calls).toEqual([["a"], ["a"]]);
});
