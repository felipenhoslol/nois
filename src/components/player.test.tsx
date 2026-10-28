// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { Player } from "./player";

const playerState: { isPlaying?: boolean; source?: string; [k: string]: unknown } = {};
const device = { theme: "ceu", animations: true };

vi.mock("@/lib/player-context", () => ({ usePlayer: () => playerState }));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ device }) }));

beforeEach(() => {
  Object.assign(playerState, {
    currentTrack: { id: "1", title: "Just Like Heaven", subtitle: "The Cure", category: "music" },
    isPlaying: false,
    progress: 38,
    currentTime: 11,
    duration: 30,
    rpm: 33,
    volume: 0.85,
    source: "audio",
    togglePlay: () => {},
    seek: () => {},
    setRpm: () => {},
    setVolume: () => {},
    playNext: () => {},
    playPrev: () => {},
  });
  device.animations = true;
});

it("vinyl spins only while playing", () => {
  playerState.isPlaying = true;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="true"/);
  playerState.isPlaying = false;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="false"/);
});

it("animations off on this device stops the vinyl", () => {
  playerState.isPlaying = true;
  device.animations = false;
  expect(renderToString(<Player onClose={() => {}} />)).toMatch(/data-spinning="false"/);
});

it("volume and RPM are disabled for Spotify and a slot is reserved for the embed", () => {
  playerState.source = "spotify";
  const html = renderToString(<Player onClose={() => {}} />);
  expect(html).toMatch(/aria-label="Volume"[^>]*disabled/);
  expect(html).toMatch(/data-spotify-slot/);
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("moves focus into the player on open and back to the opener on close", async () => {
  const opener = document.createElement("button");
  const host = document.createElement("div");
  document.body.append(opener, host);
  opener.focus();
  const root = createRoot(host);
  await act(async () => root.render(<Player onClose={() => {}} />));
  expect(document.activeElement?.getAttribute("aria-label")).toBe("Fechar player");
  await act(async () => root.unmount());
  expect(document.activeElement).toBe(opener);
});

it("Escape from a control inside the player closes it", async () => {
  const onClose = vi.fn();
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<Player onClose={onClose} />));
  const seekBar = host.querySelector<HTMLInputElement>('[aria-label="Posição da música"]')!;
  seekBar.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
  // An overlay outside the player (e.g. the Ctrl+K palette) owns its own Escape.
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());
});

it("Tab wraps from the last control back to the first", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(<Player onClose={() => {}} />));
  const focusable = host.querySelectorAll<HTMLElement>(
    "button:not(:disabled), input:not(:disabled)",
  );
  focusable[focusable.length - 1]!.focus();
  const ev = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  document.activeElement!.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(focusable[0]);
  await act(async () => root.unmount());
});
