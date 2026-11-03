// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = "";
});

it("rejects when the script fails to load, and a later call tries again", async () => {
  const { loadSpotifyIframeApi } = await import("./spotify");
  const first = loadSpotifyIframeApi();
  document.querySelector("script")!.dispatchEvent(new Event("error"));
  await expect(first).rejects.toThrow();
  expect(document.querySelectorAll("script")).toHaveLength(0);
  void loadSpotifyIframeApi().catch(() => {});
  expect(document.querySelectorAll("script")).toHaveLength(1); // failed tag removed, a fresh one added
});

it("rejects after a timeout when the API never answers", async () => {
  vi.useFakeTimers();
  const { loadSpotifyIframeApi } = await import("./spotify");
  const p = loadSpotifyIframeApi();
  const check = expect(p).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(10_000);
  await check;
  vi.useRealTimers();
});
