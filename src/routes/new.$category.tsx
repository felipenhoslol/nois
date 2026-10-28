import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { catMeta, type Category } from "@/lib/archive";
import { useArchive } from "@/lib/archive-context";
import { Field, inputClass } from "@/components/archive-ui";
import { PageHeader } from "@/components/page-header";
import { MediaPicker } from "@/components/media-picker";

export const Route = createFileRoute("/new/$category")({
  head: () => ({
    meta: [
      { title: "Novo registro — Archive" },
      { name: "description", content: "Formulário simples para guardar um novo item." },
      { property: "og:title", content: "Novo registro — Archive" },
      { property: "og:description", content: "Guarde algo novo no seu arquivo pessoal." },
    ],
  }),
  component: NewItem,
});

function NewItem() {
  const { category } = Route.useParams();
  const meta = catMeta(category);
  const { addItem } = useArchive();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<string>(meta.statuses?.[0] ?? "");
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Por favor, preencha o título antes de guardar.");
      return;
    }
    const item = addItem({
      category: meta.key as Category,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      notes: notes.trim() || undefined,
      reason: reason.trim() || undefined,
      status: status || undefined,
      rating: rating || undefined,
      date: date || undefined,
      place: place.trim() || undefined,
      favorite,
      image: imageUrl || undefined,
      audioUrl: audioUrl || undefined,
      tags: tags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean),
    });
    toast.success(`Guardado na gaveta de ${meta.label} ♡`);
    navigate({ to: "/item/$id", params: { id: item.id } });
  }

  return (
    <main className="px-4 pt-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span>{meta.emoji}</span> Novo em {meta.label}
          </span>
        }
        subtitle="adicione este pedacinho ao arquivo"
        kaomoji={meta.kaomoji}
        backTo={`/c/${meta.key}`}
        backLabel={`← ${meta.label}`}
      />

      <form onSubmit={submit} className="anim-in mt-3 grid gap-3">
        <Field label="Título">
          <input
            autoFocus
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="o que você quer guardar?"
          />
        </Field>

        <Field label={meta.fields?.[0]?.label ?? "Detalhe"}>
          <input
            className={inputClass}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="autor, marca ou complemento"
          />
        </Field>

        {/* Media Picker for visual photos / polaroids and audio */}
        <MediaPicker
          imageUrl={imageUrl}
          onImageChange={setImageUrl}
          audioUrl={audioUrl}
          onAudioChange={setAudioUrl}
          showAudio={meta.key === "music"}
        />

        {meta.statuses ? (
          <Field label="Status">
            <div className="flex flex-wrap gap-1.5">
              {meta.statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s === status ? "" : s)}
                  className={`press label-chip ${
                    s === status ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        ) : null}

        {meta.key === "memory" || meta.key === "promise" || meta.key === "said" || meta.key === "place" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data">
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Lugar">
              <input
                className={inputClass}
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="onde aconteceu?"
              />
            </Field>
          </div>
        ) : null}

        <Field label="Por que ele gosta / por que importa">
          <textarea
            rows={2}
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="o motivo ou a história por trás..."
          />
        </Field>

        <Field label="Observações">
          <textarea
            rows={3}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="pequenos detalhes, comentários ou lembretes..."
          />
        </Field>

        <Field label="Tags">
          <input
            className={inputClass}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="#nostalgia #presentes #verão"
          />
        </Field>

        <Field label="Nota de afeição">
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n === rating ? 0 : n)}
                className={`press leading-none ${
                  n <= rating ? "text-primary" : "text-muted-foreground/40"
                }`}
                aria-label={`${n} estrelas`}
              >
                ★
              </button>
            ))}
          </div>
        </Field>

        <button
          type="button"
          onClick={() => setFavorite((f) => !f)}
          className={`press card-object p-3 text-left text-sm flex items-center justify-between ${
            favorite ? "border-primary text-primary" : ""
          }`}
        >
          <span>{favorite ? "♥ marcado como favorito" : "♡ marcar como favorito"}</span>
          <span className="text-base">{favorite ? "★" : "☆"}</span>
        </button>

        <button
          type="submit"
          className="press mt-2 rounded-[var(--radius)] bg-primary px-4 py-3 font-medium text-primary-foreground shadow-lg hover:brightness-105"
        >
          Guardar no arquivo ♡
        </button>
      </form>
    </main>
  );
}
