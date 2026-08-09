import { useRef, useState } from "react";
import { exportAll, importAll } from "../lib/store";
import { supabase, syncNow, type SyncState } from "../lib/sync";
import { useCollection } from "../lib/hooks";
import type { LifeDimension, UserProfile } from "../types";
import { put } from "../lib/store";

export default function Settings({ syncState }: { syncState: SyncState }) {
  const dimensions = useCollection<LifeDimension>("dimensions");
  const profiles = useCollection<UserProfile>("profile");
  const profile = profiles[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    (document.documentElement.dataset.theme as "light" | "dark") || "light"
  );

  function download(text: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function exportJson() {
    download(await exportAll(), "the-standard-export.json", "application/json");
  }

  async function exportMarkdown() {
    const data = JSON.parse(await exportAll()) as Record<string, unknown[]>;
    const lines: string[] = ["# The Standard — export", ""];
    for (const e of (data.journal_entries ?? []) as Record<string, string>[]) {
      lines.push(`## ${e.title || new Date(e.createdAt).toLocaleDateString()}`, "", e.content, "");
    }
    download(lines.join("\n"), "the-standard-journal.md", "text/markdown");
  }

  return (
    <div className="settings fade-in">
      <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>Settings &amp; privacy</h1>

      <section className="card" style={{ marginTop: 20 }}>
        <p className="label label--quiet">Where your writing lives</p>
        <p className="quiet-note">
          Everything is saved on this device first, then synced privately to your account so
          your phone, tablet, and computer stay in step. Your entries are readable only when
          you are signed in. Nothing is sent to analytics, nothing is used for advertising,
          and journal content is never logged.
        </p>
        <p className="quiet-note" style={{ marginTop: 10 }}>
          Status: {syncState === "idle" ? "synced" : syncState === "syncing" ? "syncing now" :
            syncState === "offline" ? "offline — saved here, will sync when you return" :
            syncState === "error" ? "will retry shortly; nothing is lost" : "signed out"}.
        </p>
        <div className="pill-row" style={{ marginTop: 12 }}>
          <button className="pill" onClick={() => void syncNow()}>Sync now</button>
          {supabase && (
            <button className="pill" onClick={() => void supabase?.auth.signOut()}>Sign out</button>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="label label--quiet">Your data</p>
        <div className="pill-row">
          <button className="pill" onClick={() => void exportJson()}>Export JSON</button>
          <button className="pill" onClick={() => void exportMarkdown()}>Export Markdown</button>
          <button className="pill" onClick={() => fileRef.current?.click()}>Import a backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const { imported } = await importAll(await f.text());
              setMessage(`${imported} ${imported === 1 ? "record" : "records"} brought in.`);
            }}
          />
        </div>
        {message && <p className="quiet-note" role="status" style={{ marginTop: 10 }}>{message}</p>}
        <p className="quiet-note" style={{ marginTop: 10 }}>
          Import accepts an export from this app or from the earlier prototype.
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="label label--quiet">Appearance</p>
        <div className="pill-row">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              className="pill"
              aria-pressed={theme === t}
              onClick={() => {
                document.documentElement.dataset.theme = t;
                localStorage.setItem("theme", t);
                setTheme(t);
              }}
            >
              {t === "light" ? "Morning light" : "Evening"}
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="label label--quiet">Life dimensions</p>
        <p className="quiet-note">Hide, rename, or reorder. These are yours to shape.</p>
        <ul className="statement-list">
          {dimensions.sort((a, b) => a.order - b.order).map((d) => (
            <li key={d.id} className="dimension-row">
              <input
                defaultValue={d.name}
                onBlur={(e) => void put("dimensions", { ...d, name: e.target.value })}
                aria-label="Dimension name"
              />
              <button
                className="pill"
                aria-pressed={d.visible}
                onClick={() => void put("dimensions", { ...d, visible: !d.visible })}
              >
                {d.visible ? "Visible" : "Hidden"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="label label--quiet">Daily ritual time</p>
        <input
          type="time"
          defaultValue={profile?.ritualTime ?? ""}
          onBlur={(e) => {
            const base: UserProfile = profile ?? {
              id: crypto.randomUUID(), updatedAt: new Date().toISOString(),
              preferredName: "", personalPromise: "", embodiedQualities: [],
              availableToReceive: [], onboardingComplete: true,
            };
            void put("profile", { ...base, ritualTime: e.target.value });
          }}
          aria-label="Daily ritual time"
          style={{ maxWidth: 200 }}
        />
        <p className="quiet-note" style={{ marginTop: 8 }}>
          Saved for a future version. Reminders and notifications are not built yet — nothing
          will alert you.
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <p className="label label--quiet">Not yet built</p>
        <p className="quiet-note">
          Voice notes and transcription, reminders, and AI reflection are not implemented.
          Where you see them mentioned, they are placeholders, described honestly rather than
          simulated.
        </p>
      </section>
    </div>
  );
}
