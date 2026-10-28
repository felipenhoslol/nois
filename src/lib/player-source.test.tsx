// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, expect, it, vi } from "vitest";
import type { Item } from "./items";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const base: Item = {
  id: "x",
  category: "music",
  title: "t",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const sp: Item = {
  ...base,
  id: "sp",
  audioUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
};
const yt: Item = { ...base, id: "yt", link: "https://youtu.be/dQw4w9WgXcQ" };

const fakes = vi.hoisted(() => {
  const controller = {
    loadUri: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    togglePlay: vi.fn(),
    seek: vi.fn(),
    destroy: vi.fn(),
    addListener: vi.fn(),
  };
  const ytPlayer = {
    loadVideoById: vi.fn(),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    setPlaybackRate: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    getDuration: vi.fn(() => 0),
  };
  const createController = vi.fn((_el: unknown, _o: unknown, cb: (c: unknown) => void) =>
    cb(controller),
  );
  return { controller, ytPlayer, createController };
});

vi.mock("./archive-context", () => ({ useArchive: () => ({ items: [sp, yt] }) }));
vi.mock("./synth-audio", () => ({
  VintageSynthAudio: class {
    init() {}
    startCrackle() {}
    stop() {}
  },
}));
vi.mock("./youtube", async (orig) => ({
  ...(await orig<typeof import("./youtube")>()),
  loadYouTubeIframeAPI: vi.fn(async () => {}),
}));
vi.mock("./spotify", () => ({
  loadSpotifyIframeApi: vi.fn(async () => ({
    createController: fakes.createController,
  })),
}));

let ctx: ReturnType<typeof import("./player-context").usePlayer>;

async function mount() {
  const { PlayerProvider, usePlayer } = await import("./player-context");
  function Probe() {
    ctx = usePlayer();
    return null;
  }
  const host = document.createElement("div");
  document.body.appendChild(host);
  await act(async () => {
    createRoot(host).render(
      <PlayerProvider>
        <Probe />
      </PlayerProvider>,
    );
  });
}

beforeEach(() => {
  document.body.innerHTML =
    '<div id="archive-yt-player"></div><div id="archive-spotify-player"></div>';
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(async () => {});
  window.YT = {
    Player: class {
      constructor(_el: string, opts: { events: { onReady: (e: unknown) => void } }) {
        opts.events.onReady({ target: fakes.ytPlayer, data: 0 });
        return fakes.ytPlayer;
      }
    } as never,
  };
  vi.clearAllMocks();
});

const flush = () => act(async () => {});

it("spotify then youtube pauses the spotify controller", async () => {
  await mount();
  await act(async () => ctx.playTrack(sp));
  await flush();
  expect(ctx.source).toBe("spotify");
  expect(fakes.createController.mock.calls[0]![1]).toMatchObject({
    uri: "spotify:track:4uLU6hMCjMI75M1A2tKUQC",
  });
  expect(fakes.controller.play).toHaveBeenCalled();
  await act(async () => ctx.playTrack(yt));
  await flush();
  expect(ctx.source).toBe("youtube");
  expect(fakes.controller.pause).toHaveBeenCalled();
});

it("youtube then spotify pauses the youtube player", async () => {
  await mount();
  await act(async () => ctx.playTrack(yt));
  await flush();
  fakes.ytPlayer.pauseVideo.mockClear();
  await act(async () => ctx.playTrack(sp));
  await flush();
  expect(ctx.source).toBe("spotify");
  expect(fakes.ytPlayer.pauseVideo).toHaveBeenCalled();
});

it("playNext/playPrev walk the archive's music items", async () => {
  await mount();
  await act(async () => ctx.playTrack(sp));
  await act(async () => ctx.playNext());
  await flush();
  expect(ctx.currentTrack?.id).toBe("yt");
  await act(async () => ctx.playPrev());
  await flush();
  expect(ctx.currentTrack?.id).toBe("sp");
});
