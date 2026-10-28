import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { searchTracks } from "./music-search";

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

it("maps results and upsizes artwork", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        results: [
          {
            trackName: "Blue Moon",
            artistName: "Chet Baker",
            collectionName: "Chet",
            artworkUrl100: "https://x/100x100bb.jpg",
            previewUrl: "https://p.m4a",
            trackViewUrl: "https://music.apple.com/t",
          },
        ],
      }),
    ),
  );
  expect(await searchTracks("blue moon")).toEqual([
    {
      title: "Blue Moon",
      artist: "Chet Baker",
      album: "Chet",
      artwork: "https://x/600x600bb.jpg",
      previewUrl: "https://p.m4a",
      link: "https://music.apple.com/t",
    },
  ]);
  expect(fetchMock.mock.calls[0]![0]).toContain("term=blue%20moon");
});

it("omits missing optional fields", async () => {
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ results: [{ trackName: "X", artistName: "Y" }] })),
  );
  expect(await searchTracks("x")).toEqual([{ title: "X", artist: "Y" }]);
});

it("blank term returns [] without fetching", async () => {
  expect(await searchTracks("  ")).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("non-ok response throws", async () => {
  fetchMock.mockResolvedValue(new Response("", { status: 503 }));
  await expect(searchTracks("x")).rejects.toThrow();
});

it("passes the abort signal", async () => {
  const c = new AbortController();
  fetchMock.mockResolvedValue(new Response('{"results":[]}'));
  await searchTracks("x", c.signal);
  expect(fetchMock.mock.calls[0]![1]).toMatchObject({ signal: c.signal });
});
