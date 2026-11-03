// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import type { Item } from "@/lib/items";
import { ItemRow } from "./item-row";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const player = vi.hoisted(() => ({
  playTrack: vi.fn(),
  togglePlay: vi.fn(),
  currentTrack: null as Item | null,
  isPlaying: false,
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: unknown }) => <a href="/item">{children as never}</a>,
}));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ toggleFavorite: vi.fn() }) }));
vi.mock("@/lib/player-context", () => ({ usePlayer: () => player }));

const base: Item = {
  id: "m1",
  category: "music",
  title: "Blue Moon",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function render(item: Item) {
  const host = document.createElement("div");
  await act(async () => createRoot(host).render(<ItemRow item={item} />));
  return host;
}

it("a music row with a link has a play button that plays without navigating", async () => {
  const host = await render({ ...base, link: "https://youtu.be/dQw4w9WgXcQ" });
  const btn = host.querySelector<HTMLButtonElement>('[aria-label="Tocar Blue Moon"]')!;
  expect(btn).not.toBeNull();
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  await act(async () => btn.dispatchEvent(ev));
  expect(ev.defaultPrevented).toBe(true);
  expect(player.playTrack).toHaveBeenCalledWith(expect.objectContaining({ id: "m1" }));
});

it("the playing track's row shows Pausar and toggles", async () => {
  const item = { ...base, audioUrl: "a.mp3" };
  player.currentTrack = item;
  player.isPlaying = true;
  const host = await render(item);
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Pausar"]')!.click());
  expect(player.togglePlay).toHaveBeenCalled();
  player.currentTrack = null;
  player.isPlaying = false;
});

it("non-music rows and music without audio have no play button", async () => {
  const note = await render({ ...base, category: "note", link: "https://x.y" });
  expect(note.querySelector('[aria-label^="Tocar"]')).toBeNull();
  const bare = await render(base);
  expect(bare.querySelector('[aria-label^="Tocar"]')).toBeNull();
});
