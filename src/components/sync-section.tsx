import { useState } from "react";
import { toast } from "sonner";
import { useArchive } from "@/lib/archive-context";
import { supabase } from "@/lib/supabase";
import { Field, SectionTitle, inputClass } from "./archive-ui";

export function SyncSection() {
  const { user, ready } = useArchive();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);

  // Sign-in only: the two accounts are created in the Supabase dashboard; there is no sign-up here.
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !email.trim() || !password) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSending(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    setPassword("");
  }

  return (
    <section className="grid gap-3">
      <SectionTitle>Sincronizar na nuvem</SectionTitle>
      {!ready ? (
        // Server has no Supabase client; wait for the browser before choosing a view.
        <p className="surface-row text-sm text-muted-foreground">Carregando…</p>
      ) : !supabase ? (
        <p className="surface-row text-sm text-muted-foreground">
          Sincronização não configurada. O arquivo continua guardado só neste aparelho ♡
        </p>
      ) : user ? (
        <div className="surface-row flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0">
            <span className="block">Sincronizado</span>
            <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <button
            type="button"
            onClick={() => void supabase!.auth.signOut()}
            className="press chip min-h-11 bg-card cursor-pointer"
          >
            Sair
          </button>
        </div>
      ) : (
        <form onSubmit={signIn} className="surface-row grid gap-3">
          <Field label="E-mail">
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
          <Field label="Senha">
            <input
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button type="submit" disabled={sending} className="press btn-primary">
            {sending ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-xs text-muted-foreground">
            O arquivo é de vocês dois e aparece em todos os aparelhos em que vocês entrarem.
          </p>
        </form>
      )}
    </section>
  );
}
