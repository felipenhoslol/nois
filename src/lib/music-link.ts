import type { TrackResult } from "./music-search";
import { extractYouTubeId, getYouTubeThumbnail } from "./youtube";

export type MusicLink =
  | { kind: "youtube"; id: string; url: string }
  | { kind: "spotify"; id: string; url: string }
  | { kind: "spotify-other"; url: string };

const SPOTIFY_TRACK =
  /(?:open\.spotify\.com\/(?:[\w-]+\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/;

export function spotifyTrackId(url?: string | null): string | null {
  return url?.match(SPOTIFY_TRACK)?.[1] ?? null;
}

export function parseMusicLink(input: string): MusicLink | null {
  const url = input.trim();
  const sp = spotifyTrackId(url);
  if (sp) return { kind: "spotify", id: sp, url };
  if (/open\.spotify\.com\/|^spotify:/.test(url)) return { kind: "spotify-other", url };
  // Require a host so a plain 11-char search term is not taken for a video id.
  const yt = /youtu/i.test(url) ? extractYouTubeId(url) : null;
  return yt ? { kind: "youtube", id: yt, url } : null;
}

type Oembed = { title?: string; author_name?: string; thumbnail_url?: string };

async function oembed(endpoint: string, signal?: AbortSignal): Promise<Oembed> {
  try {
    const res = await fetch(endpoint, signal ? { signal } : undefined);
    return res.ok ? ((await res.json()) as Oembed) : {};
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return {};
  }
}

export async function resolveMusicLink(
  link: MusicLink,
  signal?: AbortSignal,
): Promise<TrackResult> {
  if (link.kind === "youtube") {
    const d = await oembed(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(link.url)}&format=json`,
      signal,
    );
    return {
      title: d.title ?? "",
      artist: d.author_name ?? "",
      artwork: getYouTubeThumbnail(link.id, "hq"),
      previewUrl: link.url,
      link: link.url,
    };
  }
  if (link.kind === "spotify") {
    const track = `https://open.spotify.com/track/${link.id}`;
    const d = await oembed(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(track)}`,
      signal,
    );
    const t: TrackResult = { title: d.title ?? "", artist: "", previewUrl: track, link: link.url };
    if (d.thumbnail_url) t.artwork = d.thumbnail_url;
    return t;
  }
  throw new Error("not a track link");
}
