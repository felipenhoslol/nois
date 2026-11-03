import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { parseMusicLink, resolveMusicLink } from "./music-link";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it.each([
  ["https://youtu.be/dQw4w9WgXcQ", { kind: "youtube", id: "dQw4w9WgXcQ" }],
  [
    "https://open.spotify.com/intl-pt/track/4uLU6hMCjMI75M1A2tKUQC?si=abc",
    { kind: "spotify", id: "4uLU6hMCjMI75M1A2tKUQC" },
  ],
  ["spotify:track:4uLU6hMCjMI75M1A2tKUQC", { kind: "spotify", id: "4uLU6hMCjMI75M1A2tKUQC" }],
  ["https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX", { kind: "spotify-other" }],
])("parseMusicLink(%s)", (input, want) => expect(parseMusicLink(input)).toMatchObject(want));

it("plain text is not a link", () => expect(parseMusicLink("chet baker")).toBeNull());

it("youtube oEmbed fills title and artist", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ title: "Never Gonna…", author_name: "Rick Astley" })),
  );
  expect(await resolveMusicLink(parseMusicLink("https://youtu.be/dQw4w9WgXcQ")!)).toMatchObject({
    title: "Never Gonna…",
    artist: "Rick Astley",
    artwork: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  });
});

it("dead youtube video still resolves with thumbnail and empty title", async () => {
  fetchMock.mockResolvedValue(new Response("", { status: 404 }));
  expect(await resolveMusicLink(parseMusicLink("https://youtu.be/kYJqUf7D70A")!)).toMatchObject({
    title: "",
    previewUrl: "https://youtu.be/kYJqUf7D70A",
  });
});

it("spotify oEmbed fills title and cover; preview is the track URL", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({ title: "Never Gonna Give You Up", thumbnail_url: "https://img/x" }),
    ),
  );
  expect(
    await resolveMusicLink(parseMusicLink("spotify:track:4uLU6hMCjMI75M1A2tKUQC")!),
  ).toMatchObject({
    title: "Never Gonna Give You Up",
    artwork: "https://img/x",
    previewUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
  });
});
