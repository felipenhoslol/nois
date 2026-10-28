import type { Item } from "./items";
import { spotifyTrackId } from "./music-link";
import { extractYouTubeId } from "./youtube";

export type PlayerSource = "youtube" | "spotify" | "audio" | "synth";

export function sourceFor(item: Item): PlayerSource {
  if (extractYouTubeId(item.audioUrl) || extractYouTubeId(item.link)) return "youtube";
  if (spotifyTrackId(item.audioUrl) || spotifyTrackId(item.link)) return "spotify";
  return item.audioUrl ? "audio" : "synth";
}

// Music items that have something to play, in archive order, wrapping around.
export function nextMusicTrack(items: Item[], currentId: string | null, dir: 1 | -1): Item | null {
  const playable = items.filter((i) => i.category === "music" && (i.audioUrl || i.link));
  const n = playable.length;
  if (!n) return null;
  const idx = playable.findIndex((i) => i.id === currentId);
  if (idx === -1) return dir === 1 ? playable[0]! : playable[n - 1]!;
  return playable[(idx + dir + n) % n]!;
}
