import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ImageIcon, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { catMeta, type Category } from "@/lib/categories";
import { useArchive } from "@/lib/archive-context";
import { usePlayer } from "@/lib/player-context";
import { Field, inputClass } from "@/components/archive-ui";
import { MediaPicker } from "@/components/media-picker";
import { PageHeader } from "@/components/page-header";

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

const actionClass =
  "press inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-4 text-base font-medium";

function ItemDetail() {
  const { id } = Route.useParams();
  const { items, updateItem, removeItem, addItem, toggleFavorite, ready } = useArchive();
  const { playTrack, openTurntable, currentTrack, isPlaying } = usePlayer();
  const navigate = useNavigate();
  const [showMediaEditor, setShowMediaEditor] = useState(false);

  const item = items.find((i) => i.id === id);

  if (!ready) {
    return <main className="px-5 pt-10 text-base text-muted-foreground">Abrindo…</main>;
  }

  if (!item) {
    return (
      <main className="px-5 pt-10 text-center">
        <p className="text-xl">Esse registro não está mais no arquivo (｡•́︿•̀｡)</p>
        <Link to="/" className="press btn-primary mt-4">
          Voltar ao arquivo
        </Link>
      </main>
    );
  }

  const meta = catMeta(item.category);
  const isThisPlaying = isPlaying && currentTrack?.id === item.id;

  const facts: [string, string][] = [
    ["Gaveta", meta.label],
    ["Status", item.status ?? ""],
    ["Data", item.date ?? ""],
    ["Lugar", item.place ?? ""],
    ["Tags", item.tags.map((t) => `#${t}`).join("  ")],
    ["Nota", item.rating ? "★".repeat(item.rating) : ""],
    ["Por que importa", item.reason ?? ""],
  ];

  return (
    <main className="px-5 pt-6 pb-12">
      <PageHeader
        title={item.title}
        subtitle={item.subtitle}
        backTo={`/c/${item.category}`}
        backLabel="Voltar"
      />

      {item.image ? (
        <img
          src={item.image}
          alt=""
          className="aspect-square w-full max-w-[280px] rounded-2xl border border-border object-cover"
        />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {(item.category === "music" || item.audioUrl) && (
          <button
            onClick={() => {
              playTrack(item);
              openTurntable();
            }}
            className="press btn-primary"
          >
            {isThisPlaying ? (
              <Pause className="h-5 w-5" aria-hidden />
            ) : (
              <Play className="h-5 w-5" aria-hidden />
            )}
            {isThisPlaying ? "Tocando" : "Tocar"}
          </button>
        )}
        <button
          onClick={() => toggleFavorite(item.id)}
          aria-pressed={item.favorite}
          className={actionClass}
        >
          <Heart
            className={`h-5 w-5 ${item.favorite ? "fill-current text-primary" : ""}`}
            aria-hidden
          />
          {item.favorite ? "Favoritado" : "Favoritar"}
        </button>
        <button onClick={() => setShowMediaEditor((v) => !v)} className={actionClass}>
          <ImageIcon className="h-5 w-5" aria-hidden />
          {showMediaEditor ? "Concluir" : "Trocar foto"}
        </button>
        <button
          onClick={() => {
            if (confirm("Remover este registro do arquivo?")) {
              removeItem(item.id);
              toast.success("Item removido.");
              navigate({ to: "/c/$category", params: { category: item.category } });
            }
          }}
          className={`${actionClass} text-destructive`}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
          Apagar
        </button>
      </div>

      {showMediaEditor && (
        <div className="mt-4">
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

      <dl className="mt-6 grid gap-3">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="surface-row">
              <dt className="text-sm text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-base">{v}</dd>
            </div>
          ))}
      </dl>

      <div className="mt-6">
        <Field label="Observações">
          <textarea
            rows={4}
            className={inputClass}
            value={item.notes ?? ""}
            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
            placeholder="Escreva aqui observações, notas ou lembretes"
          />
        </Field>
      </div>

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
          className="press btn-primary mt-4 w-full"
        >
          Transformar em ideia de presente
        </button>
      ) : null}
    </main>
  );
}
