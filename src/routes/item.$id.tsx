import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { catMeta, type Category } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { usePlayer } from "@/lib/player-context";
import { Chip, Field, HeartButton, inputClass } from "@/components/archive-ui";
import { MediaPicker } from "@/components/media-picker";

export const Route = createFileRoute("/item/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do registro — Archive" },
      { name: "description", content: "Veja e edite os detalhes deste item do arquivo." },
      { property: "og:title", content: "Detalhe do registro — Archive" },
      { property: "og:description", content: "Um pedacinho guardado no arquivo pessoal." },
    ],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const { items, updateItem, removeItem, addItem, ready } = useArchive();
  const { playTrack, openTurntable, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const [showMediaEditor, setShowMediaEditor] = useState(false);

  const item = items.find((i) => i.id === id);

  if (!ready) {
    return (
      <main className="px-4 pt-10 text-sm text-muted-foreground font-mono">
        ( ˘ω˘ ) abrindo registro…
      </main>
    );
  }

  if (!item) {
    return (
      <main className="px-4 pt-10 text-center">
        <p className="font-hand text-2xl">Esse registro não está mais no arquivo (｡•́︿•̀｡)</p>
        <Link to="/" className="label-chip press mt-4 inline-block bg-card">
          ← voltar ao arquivo
        </Link>
      </main>
    );
  }

  const meta = catMeta(item.category);
  const isThisPlaying = isPlaying && currentTrack?.id === item.id;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/c/$category", params: { category: item.category } });
    }
  };

  return (
    <main className="anim-box px-4 pt-6 pb-12">
      {/* Top Navigation Bar with Smart Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="label-chip press bg-card flex items-center gap-1.5 cursor-pointer font-medium hover:border-primary/60 text-foreground transition-colors"
          aria-label="Voltar para a tela anterior"
        >
          <span>←</span> <span>voltar</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground select-none">
            {meta.kaomoji}
          </span>
          <HeartButton item={item} />
        </div>
      </div>

      {/* Visual Cover Art / Polaroid Frame (Supports Photos & GIFs) */}
      {item.image ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="polaroid max-w-[280px] w-full rotate-[-1deg] shadow-xl bg-card transition-transform hover:rotate-0">
            <img
              src={item.image}
              alt={item.title}
              className="aspect-square w-full object-cover rounded-sm border border-border/40"
            />
            <p className="mt-2 text-center font-hand text-base text-foreground">
              {item.title} ♡
            </p>
            {item.subtitle && (
              <p className="text-center font-mono text-[0.62rem] text-muted-foreground truncate">
                {item.subtitle}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowMediaEditor(!showMediaEditor)}
            className="label-chip press mt-2 bg-card text-[0.62rem] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showMediaEditor ? "fechar editor de capa" : "alterar foto / GIF de capa ✦"}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowMediaEditor(true)}
            className="label-chip press bg-card border-dashed py-2 px-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span>+ Adicionar foto ou GIF de capa</span>
          </button>
        </div>
      )}

      {/* Inline Media Editor for Cover & Audio / YouTube */}
      {showMediaEditor && (
        <div className="mt-4 anim-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Editor de Capa e Música
            </span>
            <button
              onClick={() => setShowMediaEditor(false)}
              className="label-chip press bg-card text-[0.6rem] cursor-pointer"
            >
              concluir ✓
            </button>
          </div>
          <MediaPicker
            imageUrl={item.image}
            onImageChange={(img) => {
              updateItem(item.id, { image: img || undefined });
              toast.success("Capa atualizada ♡");
            }}
            audioUrl={item.audioUrl}
            onAudioChange={(aud) => {
              updateItem(item.id, { audioUrl: aud || undefined });
              toast.success("Áudio atualizado!");
            }}
            showAudio={item.category === "music" || Boolean(item.audioUrl)}
          />
        </div>
      )}

      {/* Main Info Card */}
      <div className="card-object mt-4 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Chip>{meta.label}</Chip>
          <span className="font-mono text-[0.6rem] text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground">{item.title}</h1>
          {item.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground font-mono">{item.subtitle}</p>
          ) : null}
        </div>

        {/* Music Play Button for Turntable */}
        {(item.category === "music" || item.audioUrl) && (
          <div className="pt-1">
            <button
              onClick={() => {
                playTrack(item);
                openTurntable();
              }}
              className="press flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-mono text-xs font-bold text-primary-foreground shadow-md hover:brightness-110 cursor-pointer"
            >
              <span>{isThisPlaying ? "❚❚" : "▶"}</span>
              <span>{isThisPlaying ? "Ouvindo no Toca-Discos" : "Tocar no Toca-Discos"}</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {item.status ? <Chip>{item.status}</Chip> : null}
          {item.date ? <Chip>{item.date}</Chip> : null}
          {item.place ? <Chip>{item.place}</Chip> : null}
          {item.tags.map((t) => (
            <span key={t} className="font-hand text-base text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>

        {item.rating ? (
          <p className="text-lg text-primary select-none">{"★".repeat(item.rating)}</p>
        ) : null}
      </div>

      {item.reason ? (
        <div className="card-object mt-3 bg-secondary/80 p-4">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
            por que importa ( ˘͈ ᵕ ˘͈ )
          </p>
          <p className="mt-1 font-hand text-lg text-foreground">{item.reason}</p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        <Field label="Observações & Memórias">
          <textarea
            rows={4}
            className={inputClass}
            value={item.notes ?? ""}
            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
            placeholder="escreva aqui observações, notas ou lembretes..."
          />
        </Field>
      </div>

      {/* "Ele mencionou isso" -> Convert to Gift button */}
      {item.category === "said" ? (
        <button
          onClick={() => {
            const gift = addItem({
              category: "gift" as Category,
              title: item.title,
              subtitle: "vindo de um comentário dele",
              status: "ideia",
              tags: ["presentes", "mencionado"],
            });
            toast.success("Ideia de presente criada a partir deste comentário!");
            navigate({ to: "/item/$id", params: { id: gift.id } });
          }}
          className="press mt-3 w-full rounded-[var(--radius)] bg-primary px-4 py-3 font-medium text-primary-foreground shadow cursor-pointer"
        >
          (づ｡◕‿◕｡)づ Transformar em ideia de presente
        </button>
      ) : null}

      <button
        onClick={() => {
          if (confirm("Remover este registro do arquivo?")) {
            removeItem(item.id);
            toast.success("Item removido.");
            navigate({ to: "/c/$category", params: { category: item.category } });
          }
        }}
        className="press mt-4 w-full rounded-[var(--radius)] border border-border p-3 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
      >
        Excluir este registro
      </button>
    </main>
  );
}
