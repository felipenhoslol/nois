import { useRef, useState } from "react";
import { Field, inputClass } from "./archive-ui";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/sync";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

const extOf = (file: File, fallback: string) =>
  file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : fallback;

// Signed in: upload to Storage and hand back its URL. Otherwise keep the data URL (works offline).
async function storeMedia(dataUrl: string, ext: string): Promise<string> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    return (await uploadMedia(blob, ext)) ?? dataUrl;
  } catch (err) {
    console.warn("Media upload failed, keeping it on this device", err);
    toast.error("não consegui enviar o arquivo, ele ficou só neste aparelho");
    return dataUrl;
  }
}

export function MediaPicker({
  imageUrl,
  onImageChange,
  audioUrl,
  onAudioChange,
  showAudio = false,
}: {
  imageUrl?: string | undefined;
  onImageChange: (url: string) => void;
  audioUrl?: string | undefined;
  onAudioChange?: (url: string) => void;
  showAudio?: boolean;
}) {
  const [tab, setTab] = useState<"file" | "url">("file");
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Check if current audio URL is a YouTube link
  const ytId = extractYouTubeId(audioUrl);

  const finishImage = async (dataUrl: string, ext: string) => {
    onImageChange(await storeMedia(dataUrl, ext));
    setIsCompressing(false);
  };

  // Process image or animated GIF file
  const processImageFile = (file: File) => {
    setIsCompressing(true);

    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");

    const reader = new FileReader();

    reader.onload = (e) => {
      const src = e.target?.result as string;

      // If it's an animated GIF, do NOT draw to Canvas (Canvas flattens GIFs to static JPEGs)
      if (isGif) {
        void finishImage(src, "gif");
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
          void finishImage(canvas.toDataURL("image/jpeg", 0.76), "jpg");
        } else {
          void finishImage(src, extOf(file, "jpg"));
        }
      };
      img.onerror = () => void finishImage(src, extOf(file, "jpg"));
      img.src = src;
    };

    reader.readAsDataURL(file);
  };

  const processAudioFile = (file: File) => {
    if (!onAudioChange) return;
    const reader = new FileReader();
    setIsCompressing(true);
    reader.onload = async (e) => {
      onAudioChange(await storeMedia(e.target?.result as string, extOf(file, "mp3")));
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="surface-row space-y-3 !p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Capa e música</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`press chip min-h-11 cursor-pointer ${
              tab === "file"
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground"
            }`}
          >
            Arquivo ou GIF
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`press chip min-h-11 cursor-pointer ${
              tab === "url"
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground"
            }`}
          >
            Link ou YouTube
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
              className="press btn-ghost min-h-11 flex-1 border-dashed text-center"
            >
              {isCompressing
                ? "Carregando..."
                : imageUrl
                  ? "Alterar foto ou GIF de capa"
                  : "Escolher foto ou GIF animado de capa"}
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => onImageChange("")}
                className="press btn-ghost min-h-11 min-w-11 text-destructive"
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
                  className="press btn-ghost min-h-11 flex-1 border-dashed text-center"
                >
                  {audioUrl && !ytId
                    ? "Áudio anexado (alterar)"
                    : "Enviar áudio do aparelho (MP3, WAV...)"}
                </button>
                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => onAudioChange("")}
                    className="press btn-ghost min-h-11 min-w-11 text-destructive"
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
          <Field label="URL da imagem ou GIF">
            <input
              className={inputClass}
              value={imageUrl ?? ""}
              onChange={(e) => onImageChange(e.target.value)}
              placeholder="https://exemplo.com/capa.gif ou .jpg"
            />
          </Field>

          {showAudio && onAudioChange && (
            <div className="space-y-2">
              <Field label="Link da música (YouTube ou áudio na web)">
                <input
                  className={inputClass}
                  value={audioUrl ?? ""}
                  onChange={(e) => onAudioChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou arquivo .mp3"
                />
              </Field>

              {/* Quick YouTube Thumbnail helper */}
              {ytId && (
                <div className="surface-row flex items-center justify-between gap-2">
                  <span className="text-sm text-foreground">Vídeo do YouTube detectado</span>
                  <button
                    type="button"
                    onClick={() => onImageChange(getYouTubeThumbnail(ytId, "hq"))}
                    className="press chip min-h-11 bg-primary text-primary-foreground border-primary cursor-pointer"
                  >
                    Usar capa do YouTube
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
          <div className="w-full max-w-[200px] rounded-2xl border border-border bg-card p-2">
            <img
              src={imageUrl}
              alt="Pré-visualização da capa"
              className="aspect-square w-full object-cover rounded-xl"
            />
            <p className="mt-1.5 text-center text-xs text-muted-foreground">Capa do arquivo</p>
          </div>
        </div>
      )}
    </div>
  );
}
