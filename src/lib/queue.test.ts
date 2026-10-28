import { expect, it } from "vitest";
import type { Item } from "./items";
import { nextMusicTrack, sourceFor } from "./queue";

const base: Item = {
  id: "x",
  category: "music",
  title: "t",
  tags: [],
  favorite: false,
  createdAt: "2026-01-01T00:00:00.000Z",
};
const m = (id: string): Item => ({ ...base, id, audioUrl: `https://a/${id}.m4a` });
const note = (id: string): Item => ({ ...base, id, category: "note", link: "https://x" });
const mNoAudio = (id: string): Item => ({ ...base, id });

it("sourceFor picks spotify for a spotify track link", () =>
  expect(
    sourceFor({ ...base, audioUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC" }),
  ).toBe("spotify"));
it("sourceFor prefers youtube, then audio, then synth", () => {
  expect(sourceFor({ ...base, link: "https://youtu.be/dQw4w9WgXcQ" })).toBe("youtube");
  expect(sourceFor({ ...base, audioUrl: "https://a/x.m4a" })).toBe("audio");
  expect(sourceFor(base)).toBe("synth");
});
it("nextMusicTrack wraps and skips non-music/unplayable", () => {
  const list = [m("a"), note("n"), m("b"), mNoAudio("c")];
  expect(nextMusicTrack(list, "b", 1)!.id).toBe("a");
  expect(nextMusicTrack(list, "a", -1)!.id).toBe("b");
  expect(nextMusicTrack([], null, 1)).toBeNull();
});
