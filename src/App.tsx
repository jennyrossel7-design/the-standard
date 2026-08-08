import { useEffect, useState } from "react";
import { ensureSeed } from "./lib/seed";
import { startSync, supabase, onSyncState, type SyncState } from "./lib/sync";
import SignIn from "./screens/SignIn";
import Today from "./screens/Today";
import Journal from "./screens/Journal";
import Heart from "./screens/Heart";
import Vision from "./screens/Vision";
import Standard from "./screens/Standard";
import Insights from "./screens/Insights";
import Settings from "./screens/Settings";

export type Nav =
  | "today" | "journal" | "heart" | "vision" | "standard"
  | "insights" | "settings";

const PRIMARY: { key: Nav; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "journal", label: "Journal" },
  { key: "heart", label: "Heart" },
  { key: "vision", label: "Vision" },
  { key: "standard", label: "Standard" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(supabase ? null : true);
  const [nav, setNav] = useState<Nav>("today");
  const [sync, setSync] = useState<SyncState>("signed-out");

  useEffect(() => {
    void ensureSeed().then(() => setReady(true));
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
      startSync();
      const off = onSyncState((s) => setSync(s));
      return () => { sub.subscription.unsubscribe(); off(); };
    }
  }, []);

  if (!ready || authed === null) return null;
  if (!authed) return <SignIn />;

  const screen =
    nav === "today" ? <Today /> :
    nav === "journal" ? <Journal /> :
    nav === "heart" ? <Heart /> :
    nav === "vision" ? <Vision /> :
    nav === "standard" ? <Standard /> :
    nav === "insights" ? <Insights /> :
    <Settings syncState={sync} />;

  const syncLine =
    !supabase ? "Local only — sync is not configured." :
    sync === "idle" ? "Synced. Your entries are protected by your sign-in." :
    sync === "syncing" ? "Syncing…" :
    sync === "offline" ? "Offline. Everything is saved here and will sync when you return." :
    sync === "error" ? "Sync will retry shortly. Nothing is lost." :
    "";

  return (
    <div className="shell">
      <nav className="rail" aria-label="Primary">
        <div className="wordmark display">The Standard</div>
        <div className="rail-items" role="tablist">
          {PRIMARY.map((item) => (
            <button
              key={item.key}
              className={`rail-item ${nav === item.key ? "rail-item--active" : ""}`}
              aria-current={nav === item.key ? "page" : undefined}
              onClick={() => setNav(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <button className="btn-quiet" onClick={() => setNav("insights")}>Insights</button>
          <button className="btn-quiet" onClick={() => setNav("settings")}>Settings &amp; privacy</button>
          <p className="sync-line">{syncLine}</p>
        </div>
      </nav>
      <main className="main">{screen}</main>
      <nav className="tabbar" aria-label="Primary">
        {PRIMARY.map((item) => (
          <button
            key={item.key}
            className={`tab-item ${nav === item.key ? "tab-item--active" : ""}`}
            aria-current={nav === item.key ? "page" : undefined}
            onClick={() => setNav(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
