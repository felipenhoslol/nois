import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Item } from "./archive";
import { extractYouTubeId, loadYouTubeIframeAPI } from "./youtube";

export type PlayerState = {
  currentTrack: Item | null;
  isPlaying: boolean;
  progress: number; // 0..100
  currentTime: number;
  duration: number;
  rpm: 33 | 45;
  volume: number;
  isTurntableOpen: boolean;
  isYouTube: boolean;
  youtubeId: string | null;
  showVideoEmbed: boolean;
  toggleVideoEmbed: () => void;
  playTrack: (item: Item) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  seek: (percent: number) => void;
  setRpm: (rpm: 33 | 45) => void;
  setVolume: (v: number) => void;
  openTurntable: () => void;
  closeTurntable: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

// Gentle synthesized nostalgic vinyl drone / chime generator using Web Audio API
class VintageSynthAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private oscs: OscillatorNode[] = [];
  private intervalId: number | null = null;

  init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startCrackle() {
    if (!this.ctx || !this.masterGain) return;
    try {
      // Create subtle vinyl hiss / crackle buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // sporadic tiny crackles
        if (Math.random() < 0.002) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.015;
        }
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start();
      this.noiseNode = noise;

      // Play soothing warm pentatonic chord progression
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C maj
        [220.0, 261.63, 329.63, 440.0], // A min
        [174.61, 220.0, 261.63, 349.23], // F maj
        [196.0, 246.94, 293.66, 392.0], // G maj
      ];
      let step = 0;

      const playChord = () => {
        if (!this.ctx || !this.masterGain) return;
        this.stopOscs();
        const chord = chords[step % chords.length]!;
        step++;
        chord.forEach((freq) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.012, this.ctx.currentTime);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          this.oscs.push(osc);
        });
      };

      playChord();
      this.intervalId = window.setInterval(playChord, 4000);
    } catch (err) {
      console.warn("Web Audio crackle fallback error:", err);
    }
  }

  stopOscs() {
    this.oscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // ignore
      }
    });
    this.oscs = [];
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stopOscs();
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Item | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [rpm, setRpmState] = useState<33 | 45>(33);
  const [volume, setVolumeState] = useState(0.85);
  const [isTurntableOpen, setIsTurntableOpen] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<VintageSynthAudio | null>(null);
  const ytPlayerRef = useRef<any>(null);
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
      await loadYouTubeIframeAPI();

      return new Promise<any>((resolve) => {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(videoId);
          ytPlayerRef.current.setVolume(volume * 100);
          ytPlayerRef.current.setPlaybackRate(rpm === 45 ? 1.25 : 1.0);
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
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
            },
            events: {
              onReady: (event: any) => {
                event.target.setVolume(volume * 100);
                event.target.setPlaybackRate(rpm === 45 ? 1.25 : 1.0);
                event.target.playVideo();
                resolve(event.target);
              },
              onStateChange: (event: any) => {
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
              onError: (err: any) => {
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
    if (isPlaying && !isYouTube && (!currentTrack?.audioUrl || !audioRef.current?.src)) {
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
  }, [isPlaying, isYouTube, currentTrack, duration]);

  const playTrack = useCallback(
    (item: Item) => {
      setCurrentTrack(item);
      setIsPlaying(true);
      setCurrentTime(0);
      setProgress(0);

      const ytId = extractYouTubeId(item.audioUrl) || extractYouTubeId(item.link);

      if (ytId) {
        // Pause direct HTML5 audio & stop synth
        if (audioRef.current) audioRef.current.pause();
        synthRef.current?.stop();

        setIsYouTube(true);
        setYoutubeId(ytId);
        initYouTubePlayer(ytId);
      } else if (item.audioUrl && audioRef.current) {
        // Stop YouTube player
        if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        }
        setIsYouTube(false);
        setYoutubeId(null);
        synthRef.current?.stop();

        audioRef.current.src = item.audioUrl;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = rpm === 45 ? 1.25 : 1.0;
        audioRef.current.play().catch((e) => {
          console.warn("Direct audio play prevented, falling back to synth:", e);
          synthRef.current?.init();
          synthRef.current?.startCrackle();
        });
      } else {
        // Synth nostalgic fallback
        if (audioRef.current) audioRef.current.pause();
        if (ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        }
        setIsYouTube(false);
        setYoutubeId(null);
        synthRef.current?.init();
        synthRef.current?.startCrackle();
      }
    },
    [volume, rpm, initYouTubePlayer],
  );

  const pauseTrack = useCallback(() => {
    setIsPlaying(false);
    if (isYouTube && ytPlayerRef.current && ytPlayerRef.current.pauseVideo) {
      ytPlayerRef.current.pauseVideo();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    synthRef.current?.stop();
  }, [isYouTube]);

  const resumeTrack = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying(true);
    if (isYouTube && ytPlayerRef.current && ytPlayerRef.current.playVideo) {
      ytPlayerRef.current.playVideo();
    } else if (currentTrack.audioUrl && audioRef.current?.src) {
      audioRef.current.play().catch(() => {});
    } else {
      synthRef.current?.init();
      synthRef.current?.startCrackle();
    }
  }, [currentTrack, isYouTube]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  }, [isPlaying, pauseTrack, resumeTrack]);

  const seek = useCallback(
    (percent: number) => {
      const target = (percent / 100) * duration;
      setCurrentTime(target);
      setProgress(percent);

      if (isYouTube && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(target, true);
      } else if (audioRef.current && audioRef.current.duration) {
        audioRef.current.currentTime = target;
      }
    },
    [duration, isYouTube],
  );

  const setRpm = useCallback(
    (newRpm: 33 | 45) => {
      setRpmState(newRpm);
      const rate = newRpm === 45 ? 1.25 : 1.0;
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
      if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
        ytPlayerRef.current.setPlaybackRate(rate);
      }
    },
    [],
  );

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      if (audioRef.current) {
        audioRef.current.volume = v;
      }
      if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
        ytPlayerRef.current.setVolume(v * 100);
      }
    },
    [],
  );

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
        isYouTube,
        youtubeId,
        showVideoEmbed,
        toggleVideoEmbed,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlay,
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
