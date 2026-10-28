import { useRef, useState } from "react";
import { Field, inputClass } from "./archive-ui";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

export function MediaPicker({
  imageUrl,
  onImageChange,
  audioUrl,
  onAudioChange,
  showAudio = false,
}: {
  imageUrl?: string;
  onImageChange: (url: string) => void;
  audioUrl?: string;
  onAudioChange?: (url: string) => void;
  showAudio?: boolean;
}) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Check if current audio URL is a YouTube link
  const ytId = extractYouTubeId(audioUrl);

  // Process image or animated GIF file
  const processImageFile = (file: File) => {
    setIsCompressing(true);

    const isGif =
      file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");

    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;

      // If it's an animated GIF, do NOT draw to Canvas (Canvas flattens GIFs to static JPEGs)
      if (isGif) {
        onImageChange(src);
        setIsCompressing(false);
        return;
      }

      // For normal static images, optimize with canvas to keep localStorage safe
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 650;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.76);
          onImageChange(compressed);
        } else {
          onImageChange(src);
        }
        setIsCompressing(false);
      };
      img.onerror = () => {
        onImageChange(src);
        setIsCompressing(false);
      };
      img.src = src;
    };

    reader.readAsDataURL(file);
  };

  const processAudioFile = (file: File) => {
    if (!onAudioChange) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      onAudioChange(src);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="card-object p-4 space-y-3 bg-secondary/40 border border-border/80">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <span>( ˘ ³˘)♥</span> Capa & Música
        </span>
        <div className="flex gap-1 bg-card rounded-md p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`press px-2.5 py-0.5 text-[0.65rem] font-mono rounded cursor-pointer ${
              tab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Arquivo / GIF
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`press px-2.5 py-0.5 text-[0.65rem] font-mono rounded cursor-pointer ${
              tab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Link URL / YouTube
          </button>
        </div>
      </div>

      {tab === "file" ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImageFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="press flex-1 rounded-[var(--radius-sm)] border border-dashed border-border bg-paper px-3 py-2.5 text-xs font-mono text-center hover:bg-muted cursor-pointer"
            >
              {isCompressing
                ? "Carregando mídia..."
                : imageUrl
                ? "🖼️ Alterar foto ou GIF de capa"
                : "📷 Escolher foto ou GIF animado de capa"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => onImageChange("")}
                className="press rounded-md border border-border px-2.5 py-2.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                title="Remover capa"
              >
                ✕
              </button>
            )}
          </div>

          {showAudio && onAudioChange && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processAudioFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="press flex-1 rounded-[var(--radius-sm)] border border-dashed border-border bg-paper px-3 py-2.5 text-xs font-mono text-center hover:bg-muted cursor-pointer"
                >
                  {audioUrl && !ytId
                    ? "🎵 Arquivo de áudio anexado (alterar)"
                    : "🎵 Enviar áudio local (MP3, WAV...)"}
                </button>
                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => onAudioChange("")}
                    className="press rounded-md border border-border px-2.5 py-2.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                    title="Remover áudio"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="URL da Imagem ou GIF">
            <input
              className={inputClass}
              value={imageUrl ?? ""}
              onChange={(e) => onImageChange(e.target.value)}
              placeholder="https://exemplo.com/capa.gif ou .jpg"
            />
          </Field>

          {showAudio && onAudioChange && (
            <div className="space-y-2">
              <Field label="Link da Música (YouTube ou Áudio Web)">
                <input
                  className={inputClass}
                  value={audioUrl ?? ""}
                  onChange={(e) => onAudioChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou arquivo .mp3"
                />
              </Field>

              {/* Quick YouTube Thumbnail helper */}
              {ytId && (
                <div className="flex items-center justify-between rounded-md bg-secondary/80 px-3 py-2 border border-border">
                  <span className="text-xs font-mono text-foreground flex items-center gap-1.5">
                    <span className="text-red-500">▶</span> Vídeo do YouTube detectado!
                  </span>
                  <button
                    type="button"
                    onClick={() => onImageChange(getYouTubeThumbnail(ytId, "hq"))}
                    className="press label-chip bg-primary text-primary-foreground text-[0.62rem] font-mono cursor-pointer"
                  >
                    ✦ Usar Capa do YouTube
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Live Cover Preview (Supports GIFs and Photos) */}
      {imageUrl && (
        <div className="flex flex-col items-center pt-2">
          <div className="polaroid max-w-[200px] w-full rotate-1 shadow-lg bg-card">
            <img
              src={imageUrl}
              alt="Pré-visualização da capa"
              className="aspect-square w-full object-cover rounded-sm border border-border/40"
            />
            <p className="mt-1.5 text-center font-hand text-xs text-muted-foreground">
              capa do arquivo (˶ᵔ ᵕ ᵔ˶)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
