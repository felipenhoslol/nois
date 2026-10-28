import { useState } from "react";
import { toast } from "sonner";
import { useArchive } from "@/lib/archive-context";
import { supabase } from "@/lib/supabase";
import { Field, SectionTitle, inputClass } from "./archive-ui";

export function SyncSection() {
  const { user, ready } = useArchive();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // Only the two existing accounts can sign in; the link never creates a new one.
      options: { emailRedirectTo: `${window.location.origin}/settings`, shouldCreateUser: false },
    });
    setSending(false);
    if (error) {
      toast.error("Esse e-mail não tem acesso a este arquivo. Confere se digitou certo ♡");
      return;
    }
    setSent(true);
  }

  return (
    <section className="mt-6 grid gap-2">
      <SectionTitle>sincronizar na nuvem</SectionTitle>
      {!ready ? (
        // Server has no Supabase client; wait for the browser before choosing a view.
        <p className="card-object p-3 text-sm text-muted-foreground">carregando…</p>
      ) : !supabase ? (
        <p className="card-object p-3 text-sm text-muted-foreground">
          Sincronização não configurada. O arquivo continua guardado só neste aparelho ♡
        </p>
      ) : user ? (
        <div className="card-object flex items-center justify-between gap-3 p-3 text-sm">
          <span className="min-w-0">
            <span className="block">sincronizado ♡</span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void supabase!.auth.signOut()}
            className="press label-chip bg-card"
          >
            sair
          </button>
        </div>
      ) : sent ? (
        <p className="card-object p-3 text-sm">
          Link enviado para <b>{email}</b>. Abra o e-mail neste aparelho para entrar ♡
        </p>
      ) : (
        <form onSubmit={sendLink} className="card-object grid gap-2 p-3">
          <Field label="Seu e-mail">
            <input
              type="email"
              required
              autoComplete="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </Field>
          <button type="submit" disabled={sending} className="press btn-primary text-sm">
            {sending ? "enviando…" : "receber link de acesso"}
          </button>
          <p className="text-xs text-muted-foreground">
            Sem senha: você recebe um link por e-mail. O arquivo é de vocês dois e aparece em todos
            os aparelhos.
          </p>
        </form>
      )}
    </section>
  );
}
