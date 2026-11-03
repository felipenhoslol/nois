// Minimal typing + loader for the Spotify embed IFrame API.

export type SpotifyPlaybackUpdate = {
  data: { isPaused: boolean; isBuffering: boolean; position: number; duration: number };
};

export type SpotifyController = {
  loadUri(uri: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  togglePlay(): void;
  seek(seconds: number): void;
  destroy(): void;
  addListener(event: "playback_update", cb: (e: SpotifyPlaybackUpdate) => void): void;
  addListener(event: "ready", cb: () => void): void;
};

export type SpotifyIFrameAPI = {
  createController(
    el: HTMLElement,
    opts: { uri: string; width: string | number; height: string | number },
    cb: (controller: SpotifyController) => void,
  ): void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady: ((api: SpotifyIFrameAPI) => void) | undefined;
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

export function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    // Blocked or offline: fail instead of hanging, so the player can stop and retry later.
    const timer = window.setTimeout(() => reject(new Error("Spotify API timeout")), 10_000);
    window.onSpotifyIframeApiReady = (api) => {
      window.clearTimeout(timer);
      resolve(api);
    };
    const tag = document.createElement("script");
    tag.src = "https://open.spotify.com/embed/iframe-api/v1";
    tag.async = true;
    tag.onerror = () => {
      window.clearTimeout(timer);
      tag.remove();
      reject(new Error("Spotify API failed to load"));
    };
    document.body.appendChild(tag);
  }).catch((err: unknown) => {
    apiPromise = null;
    throw err;
  });
  return apiPromise;
}
