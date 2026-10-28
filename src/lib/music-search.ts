// iTunes Search API: free, no key, CORS enabled. Returns cover art and a 30 s preview.
export type TrackResult = {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  previewUrl?: string;
  link?: string;
};

type ITunesTrack = {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

export async function searchTracks(term: string, signal?: AbortSignal): Promise<TrackResult[]> {
  if (!term.trim()) return [];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term.trim())}&media=music&entity=song&limit=8&country=BR`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`);
  const data = (await res.json()) as { results?: ITunesTrack[] };
  return (data.results ?? [])
    .filter((r) => r.trackName)
    .map((r) => {
      const t: TrackResult = { title: r.trackName!, artist: r.artistName ?? "" };
      if (r.collectionName) t.album = r.collectionName;
      if (r.artworkUrl100) t.artwork = r.artworkUrl100.replace("100x100bb", "600x600bb");
      if (r.previewUrl) t.previewUrl = r.previewUrl;
      if (r.trackViewUrl) t.link = r.trackViewUrl;
      return t;
    });
}
