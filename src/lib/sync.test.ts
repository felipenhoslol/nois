import { afterEach, expect, it, vi } from "vitest";
import type { Item } from "./items";
import { createDebouncedUpserter, mergeItems, parseBackup } from "./sync";

const mk = (id: string, extra: Partial<Item> = {}): Item => ({
  id,
  category: "note",
  title: id,
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...extra,
});
const a = mk("a");
const b = mk("b");
const seed = mk("seed-1");

afterEach(() => vi.useRealTimers());

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

it("merged is newest first", () => {
  const old = mk("old", { createdAt: "2025-01-01T00:00:00.000Z" });
  const nu = mk("new", { createdAt: "2026-06-01T00:00:00.000Z" });
  expect(mergeItems([old], [nu]).merged.map((i) => i.id)).toEqual(["new", "old"]);
});

it("parseBackup accepts a valid backup", () => {
  const r = parseBackup({ items: [a], settings: { archiveName: "X" } });
  expect(r.items[0]!.id).toBe("a");
  expect(r.settings).toEqual({ archiveName: "X" });
});

it("parseBackup rejects bad shape", () => {
  expect(() => parseBackup({ items: "x" })).toThrow();
  expect(() => parseBackup({ items: [{ title: "sem id" }] })).toThrow();
  expect(() => parseBackup(null)).toThrow();
});

it("debounces by id", async () => {
  vi.useFakeTimers();
  const flush = vi.fn().mockResolvedValue(undefined);
  const u = createDebouncedUpserter(flush, 800);
  u.push({ ...a, notes: "o" });
  u.push({ ...a, notes: "oi" });
  u.push(b);
  await vi.advanceTimersByTimeAsync(799);
  expect(flush).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(flush).toHaveBeenCalledTimes(1);
  expect(flush.mock.calls[0]![0]).toEqual([{ ...a, notes: "oi" }, b]);
});

it("flushNow sends pending immediately", async () => {
  vi.useFakeTimers();
  const flush = vi.fn().mockResolvedValue(undefined);
  const u = createDebouncedUpserter(flush, 800);
  u.push(a);
  await u.flushNow();
  expect(flush).toHaveBeenCalledWith([a]);
  await vi.advanceTimersByTimeAsync(800);
  expect(flush).toHaveBeenCalledTimes(1);
});
