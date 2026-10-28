import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useArchive } from "./archive-context";
import type { Item } from "./items";
import { spotifyTrackId } from "./music-link";
import { nextMusicTrack, sourceFor, type PlayerSource } from "./queue";
import { loadSpotifyIframeApi, type SpotifyController } from "./spotify";
import { VintageSynthAudio } from "./synth-audio";
import {
  extractYouTubeId,
  loadYouTubeIframeAPI,
  rpmToRate,
  type YTPlayer,
  type YTPlayerEvent,
} from "./youtube";

export type PlayerState = {
  currentTrack: Item | null;
  isPlaying: boolean;
  progress: number; // 0..100
  currentTime: number;
  duration: number;
  rpm: 33 | 45;
  volume: number;
  isTurntableOpen: boolean;
  source: PlayerSource;
  isYouTube: boolean;
  youtubeId: string | null;
  showVideoEmbed: boolean;
  toggleVideoEmbed: () => void;
  playTrack: (item: Item) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (percent: number) => void;
  setRpm: (rpm: 33 | 45) => void;
  setVolume: (v: number) => void;
  openTurntable: () => void;
  closeTurntable: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Item | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [rpm, setRpmState] = useState<33 | 45>(33);
  const [volume, setVolumeState] = useState(0.85);
  const [isTurntableOpen, setIsTurntableOpen] = useState(false);
  const [source, setSource] = useState<PlayerSource>("synth");
  const isYouTube = source === "youtube";
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  const { items } = useArchive();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<VintageSynthAudio | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const spotifyRef = useRef<SpotifyController | null>(null);
  const spotifyInitRef = useRef(false);
  const ytReqRef = useRef(0);
  const ytVideoRef = useRef("");
  const spotifyUriRef = useRef("");
  // Read inside player callbacks so events from a source we just left are ignored.
  const sourceRef = useRef<PlayerSource>("synth");
  const ytTimerRef = useRef<number | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  // Setup HTML5 Audio element
  useEffect(() => {
    synthRef.current = new VintageSynthAudio();
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      synthRef.current?.stop();
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, []);

  // Initialize or attach YouTube player
  const initYouTubePlayer = useCallback(
    async (videoId: string) => {
      const req = ++ytReqRef.current;
      ytVideoRef.current = videoId;
      await loadYouTubeIframeAPI();
      // Latest wins: a newer tap (or a switch to another source) made this call stale.
      if (req !== ytReqRef.current || sourceRef.current !== "youtube") return null;

      return new Promise<YTPlayer | null>((resolve) => {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.setVolume(volume * 100);
          ytPlayerRef.current.setPlaybackRate(rpmToRate(rpm));
          ytPlayerRef.current.playVideo();
          resolve(ytPlayerRef.current);
          return;
        }

        const el = document.getElementById("archive-yt-player");
        if (!el || !window.YT) {
          resolve(null);
          return;
        }

        try {
          ytPlayerRef.current = new window.YT.Player("archive-yt-player", {
            height: "100%",
            width: "100%",
            videoId: videoId,
            playerVars: {
              autoplay: 0, // onReady starts it, only if YouTube is still the source
              controls: 0,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
            },
            events: {
              onReady: (event: YTPlayerEvent) => {
                event.target.setVolume(volume * 100);
                event.target.setPlaybackRate(rpmToRate(rpm));
                if (sourceRef.current === "youtube") {
                  // A newer video tapped before the player was ready replaces this one.
                  if (ytVideoRef.current !== videoId)
                    event.target.loadVideoById(ytVideoRef.current);
                  event.target.playVideo();
                }
                resolve(event.target);
              },
              onStateChange: (event: YTPlayerEvent) => {
                if (sourceRef.current !== "youtube") return;
                // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                if (event.data === 1) {
                  setIsPlaying(true);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                } else if (event.data === 0) {
                  setIsPlaying(false);
                  setProgress(0);
                  setCurrentTime(0);
                }
              },
              onError: (err: unknown) => {
                console.warn("YouTube player error, falling back to synth:", err);
                synthRef.current?.init();
                synthRef.current?.startCrackle();
              },
            },
          });
        } catch (e) {
          console.warn("Could not create YouTube player:", e);
          resolve(null);
        }
      });
    },
    [volume, rpm],
  );

  // YouTube progress sync interval
  useEffect(() => {
    if (isYouTube && isPlaying) {
      ytTimerRef.current = window.setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          try {
            const current = ytPlayerRef.current.getCurrentTime();
            const dur = ytPlayerRef.current.getDuration();
            if (dur > 0) {
              setDuration(dur);
              setCurrentTime(current);
              setProgress((current / dur) * 100);
            }
          } catch {
            // ignore
          }
        }
      }, 500);
    } else {
      if (ytTimerRef.current) {
        clearInterval(ytTimerRef.current);
        ytTimerRef.current = null;
      }
    }
    return () => {
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
    };
  }, [isYouTube, isPlaying]);

  // Synthetic Vinyl timer for tracks without audio URL or YouTube
  useEffect(() => {
    if (isPlaying && source === "synth") {
      synthTimerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          if (next >= duration) {
            setIsPlaying(false);
            synthRef.current?.stop();
            return 0;
          }
          setProgress((next / duration) * 100);
          return next;
        });
      }, 1000);
    } else {
      if (synthTimerRef.current) {
        clearInterval(synthTimerRef.current);
        synthTimerRef.current = null;
      }
    }
    return () => {
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, [isPlaying, source, duration]);

  const playSpotify = useCallback(async (id: string) => {
    const uri = `spotify:track:${id}`;
    spotifyUriRef.current = uri;
    if (spotifyRef.current) {
      spotifyRef.current.loadUri(uri);
      spotifyRef.current.play();
      return;
    }
    if (spotifyInitRef.current) return; // controller on its way; it picks up spotifyUriRef
    spotifyInitRef.current = true;
    const api = await loadSpotifyIframeApi();
    const el = document.getElementById("archive-spotify-player");
    if (!el) {
      spotifyInitRef.current = false;
      return;
    }
    api.createController(el, { uri, width: "100%", height: 152 }, (c) => {
      spotifyRef.current = c;
      if (spotifyUriRef.current !== uri) c.loadUri(spotifyUriRef.current);
      c.addListener("ready", () => {
        if (sourceRef.current === "spotify") c.play();
      });
      c.addListener("playback_update", ({ data }) => {
        if (sourceRef.current !== "spotify") return;
        setIsPlaying(!data.isPaused);
        if (data.duration > 0) {
          setDuration(data.duration / 1000);
          setCurrentTime(data.position / 1000);
          setProgress((data.position / data.duration) * 100);
        }
      });
      if (sourceRef.current === "spotify") c.play();
    });
  }, []);

  // Pause every source except `keep`, so two never play at once.
  const stopOthers = useCallback((keep: PlayerSource) => {
    if (keep !== "youtube") ytPlayerRef.current?.pauseVideo?.();
    if (keep !== "spotify") spotifyRef.current?.pause();
    if (keep !== "audio") audioRef.current?.pause();
    synthRef.current?.stop();
  }, []);

  const playTrack = useCallback(
    (item: Item) => {
      const next = sourceFor(item);
      stopOthers(next);
      sourceRef.current = next;
      setSource(next);
      setCurrentTrack(item);
      setIsPlaying(true);
      setCurrentTime(0);
      setProgress(0);

      const ytId = extractYouTubeId(item.audioUrl) || extractYouTubeId(item.link);
      setYoutubeId(ytId);

      if (next === "youtube" && ytId) {
        initYouTubePlayer(ytId);
      } else if (next === "spotify") {
        const id = spotifyTrackId(item.audioUrl) ?? spotifyTrackId(item.link);
        if (id) void playSpotify(id);
      } else if (next === "audio" && item.audioUrl && audioRef.current) {
        audioRef.current.src = item.audioUrl;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = rpmToRate(rpm);
        audioRef.current.play().catch((e) => {
          console.warn("Direct audio play prevented, falling back to synth:", e);
          synthRef.current?.init();
          synthRef.current?.startCrackle();
        });
      } else {
        synthRef.current?.init();
        synthRef.current?.startCrackle();
      }
    },
    [volume, rpm, initYouTubePlayer, playSpotify, stopOthers],
  );

  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
    stopOthers("synth");
  }, [stopOthers]);

  const resumeTrack = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying(true);
    if (source === "youtube") {
      ytPlayerRef.current?.playVideo?.();
    } else if (source === "spotify") {
      spotifyRef.current?.resume();
    } else if (source === "audio" && audioRef.current?.src) {
      audioRef.current.play().catch(() => {});
    } else {
      synthRef.current?.init();
      synthRef.current?.startCrackle();
    }
  }, [currentTrack, source]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  }, [isPlaying, pauseTrack, resumeTrack]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const next = nextMusicTrack(items, currentTrack?.id ?? null, dir);
      if (next) playTrack(next);
    },
    [items, currentTrack, playTrack],
  );
  const playNext = useCallback(() => step(1), [step]);
  const playPrev = useCallback(() => step(-1), [step]);

  const seek = useCallback(
    (percent: number) => {
      const target = (percent / 100) * duration;
      setCurrentTime(target);
      setProgress(percent);

      if (source === "youtube") {
        ytPlayerRef.current?.seekTo?.(target, true);
      } else if (source === "spotify") {
        spotifyRef.current?.seek(target);
      } else if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = target;
      }
    },
    [duration, source],
  );

  const setRpm = useCallback((newRpm: 33 | 45) => {
    setRpmState(newRpm);
    const rate = rpmToRate(newRpm);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
      ytPlayerRef.current.setPlaybackRate(rate);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
      ytPlayerRef.current.setVolume(v * 100);
    }
  }, []);

  const openTurntable = useCallback(() => setIsTurntableOpen(true), []);
  const closeTurntable = useCallback(() => setIsTurntableOpen(false), []);
  const toggleVideoEmbed = useCallback(() => setShowVideoEmbed((v) => !v), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        currentTime,
        duration,
        rpm,
        volume,
        isTurntableOpen,
        source,
        isYouTube,
        youtubeId,
        showVideoEmbed,
        toggleVideoEmbed,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlay,
        playNext,
        playPrev,
        seek,
        setRpm,
        setVolume,
        openTurntable,
        closeTurntable,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}
