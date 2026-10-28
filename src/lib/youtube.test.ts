import { describe, expect, it } from "vitest";
import { extractYouTubeId, getYouTubeThumbnail } from "./youtube";

describe("extractYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=kYJqUf7D70A", "kYJqUf7D70A"],
    ["https://youtu.be/kYJqUf7D70A", "kYJqUf7D70A"],
    ["https://music.youtube.com/watch?v=kYJqUf7D70A&list=x", "kYJqUf7D70A"],
    ["https://www.youtube.com/shorts/kYJqUf7D70A", "kYJqUf7D70A"],
    ["kYJqUf7D70A", "kYJqUf7D70A"],
  ])("%s", (url, id) => expect(extractYouTubeId(url)).toBe(id));

  it("returns null for non-YouTube", () => {
    expect(extractYouTubeId("https://example.com/a.mp3")).toBeNull();
    expect(extractYouTubeId(undefined)).toBeNull();
  });
});

it("thumbnail hq", () =>
  expect(getYouTubeThumbnail("abc")).toBe("https://img.youtube.com/vi/abc/hqdefault.jpg"));
