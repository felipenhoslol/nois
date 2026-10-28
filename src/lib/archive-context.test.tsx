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
  deleteRemoteItems: vi.fn(),
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

const fakeAuth = () => ({
  auth: {
    onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
      auth.cb = cb;
      return { data: { subscription: { unsubscribe() {} } } };
    },
  },
});
const signIn = async (id: string) => {
  await act(async () => {
    auth.cb!("SIGNED_IN", { user: { id, email: id + "@x.y" } });
    await vi.advanceTimersByTimeAsync(1);
  });
};

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
  expect(sync.deleteRemoteItems).toHaveBeenCalledWith(["r1"]);
});

it("delete right after an edit is not undone by the pending upsert", async () => {
  vi.useFakeTimers();
  supabaseMock.value = fakeAuth();
  sync.fetchRemote.mockResolvedValue({ items: [remoteItem], settings: null });
  await mount();
  await signIn("u1");
  sync.upsertItems.mockClear();
  await act(async () => ctx.updateItem("r1", { notes: "x" }));
  await act(async () => ctx.removeItem("r1"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  const uploaded = sync.upsertItems.mock.calls.flatMap((c) => c[1] as Item[]).map((i) => i.id);
  expect(uploaded).not.toContain("r1");
  expect(sync.deleteRemoteItems).toHaveBeenCalledWith(["r1"]);
});

it("an edit that never reached the cloud survives the next sign-in", async () => {
  vi.useFakeTimers();
  supabaseMock.value = fakeAuth();
  sync.fetchRemote.mockResolvedValue({ items: [remoteItem], settings: null });
  await mount();
  await signIn("u1");
  sync.upsertItems.mockRejectedValue(new Error("offline"));
  await act(async () => ctx.updateItem("r1", { notes: "não enviado" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  // reload: same user, cloud still has the old version
  sync.upsertItems.mockReset().mockResolvedValue(undefined);
  vi.resetModules();
  await mount();
  await signIn("u1");
  expect(ctx.items.find((i) => i.id === "r1")!.notes).toBe("não enviado");
  expect(sync.upsertItems.mock.calls.flatMap((c) => c[1] as Item[]).map((i) => i.id)).toContain(
    "r1",
  );
});

it("a different account does not receive the previous account's items", async () => {
  vi.useFakeTimers();
  supabaseMock.value = fakeAuth();
  sync.fetchRemote.mockResolvedValue({ items: [remoteItem], settings: null });
  await mount();
  await signIn("u1");
  await act(async () => auth.cb!("SIGNED_OUT", null));
  sync.upsertItems.mockClear();
  sync.fetchRemote.mockResolvedValue({ items: [], settings: null });
  await signIn("u2");
  expect(ctx.items).toEqual([]);
  expect(sync.upsertItems.mock.calls.flatMap((c) => c[1] as Item[])).toEqual([]);
});

it("signing out during the first merge leaves no session", async () => {
  vi.useFakeTimers();
  supabaseMock.value = fakeAuth();
  let release!: (v: unknown) => void;
  sync.fetchRemote.mockReturnValue(new Promise((r) => (release = r)));
  await mount();
  await signIn("u1");
  await act(async () => auth.cb!("SIGNED_OUT", null));
  await act(async () => release({ items: [remoteItem], settings: null }));
  expect(ctx.user).toBeNull();
});
