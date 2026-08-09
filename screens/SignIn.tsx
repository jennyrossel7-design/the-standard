import { useState } from "react";
import { supabase } from "../lib/sync";
import { CORE_PROMISE } from "../lib/seed";

/** Sign-in — the doorway. Calm, not corporate. */
export default function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    if (error) setMessage(error.message);
    else if (mode === "up") setMessage("Check your email to confirm, then sign in.");
    setBusy(false);
  }

  return (
    <div className="signin fade-in">
      <div className="signin-inner">
        <div className="wordmark display">The Standard</div>
        <p className="signin-promise display">{CORE_PROMISE}</p>

        <form onSubmit={submit} className="signin-form">
          <label>
            <span className="label label--quiet">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span className="label label--quiet">Password</span>
            <input
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <button className="btn-primary" disabled={busy} type="submit">
            {busy ? "One moment…" : mode === "in" ? "Enter The Standard" : "Create your space"}
          </button>
        </form>

        {message && <p className="signin-message" role="status">{message}</p>}

        <button
          className="btn-quiet"
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setMessage(null); }}
        >
          {mode === "in" ? "First time here? Create your private space." : "Already have a space? Sign in."}
        </button>

        <p className="signin-note">
          Your writing is stored privately under your account and is readable only
          when you are signed in. Nothing here is used for anything else.
        </p>
      </div>
    </div>
  );
}
