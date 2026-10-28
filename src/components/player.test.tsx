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
