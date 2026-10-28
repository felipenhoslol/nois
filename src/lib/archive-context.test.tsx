// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Item } from "./items";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const remoteItem: Item = {
  id: "r1",
  category: "note",
  title: "da nuvem",
  tags: [],
  favorite: false,
  createdAt: "2026-02-01T00:00:00.000Z",
};

const sync = vi.hoisted(() => ({
  fetchRemote: vi.fn(),
  upsertItems: vi.fn(),
  deleteRemoteItem: vi.fn(),
  saveRemoteSettings: vi.fn(),
}));
vi.mock("./sync", async (orig) => ({ ...(await orig<typeof import("./sync")>()), ...sync }));

const auth = vi.hoisted(() => ({ cb: null as null | ((e: string, s: unknown) => void) }));
const supabaseMock = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("./supabase", () => ({
  get supabase() {
    return supabaseMock.value;
  },
}));

let ctx: ReturnType<typeof import("./archive-context").useArchive>;

async function mount() {
  const { ArchiveProvider, useArchive } = await import("./archive-context");
  function Probe() {
    ctx = useArchive();
    return null;
  }
  const el = document.createElement("div");
  await act(async () => {
    createRoot(el).render(
      <ArchiveProvider>
        <Probe />
      </ArchiveProvider>,
    );
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  Object.values(sync).forEach((f) => f.mockReset().mockResolvedValue(undefined));
  supabaseMock.value = null;
  auth.cb = null;
});
afterEach(() => vi.useRealTimers());

it("without supabase never calls the cloud", async () => {
  await mount();
  await act(async () => {
    ctx.addItem({ category: "note", title: "x" });
  });
  expect(ctx.items[0]!.title).toBe("x");
  Object.values(sync).forEach((f) => expect(f).not.toHaveBeenCalled());
});

it("on sign-in merges cloud items without uploading seeds, then debounces edits", async () => {
  vi.useFakeTimers();
  supabaseMock.value = {
    auth: {
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        auth.cb = cb;
        return { data: { subscription: { unsubscribe() {} } } };
      },
    },
  };
  sync.fetchRemote.mockResolvedValue({ items: [remoteItem], settings: null });
  await mount();
  expect(ctx.items.every((i) => i.id.startsWith("seed-"))).toBe(true);

  await act(async () => {
    auth.cb!("SIGNED_IN", { user: { id: "u1", email: "a@b.c" } });
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(ctx.items.map((i) => i.id)).toEqual(["r1"]);
  expect(sync.upsertItems).toHaveBeenCalledWith("u1", []);
  expect(ctx.user).toEqual({ email: "a@b.c" });

  sync.upsertItems.mockClear();
  await act(async () => {
    ctx.updateItem("r1", { notes: "o" });
  });
  await act(async () => {
    ctx.updateItem("r1", { notes: "oi" });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  expect(sync.upsertItems).toHaveBeenCalledTimes(1);
  expect(sync.upsertItems.mock.calls[0]![1][0].notes).toBe("oi");

  await act(async () => {
    ctx.removeItem("r1");
  });
  expect(sync.deleteRemoteItem).toHaveBeenCalledWith("r1");
});
