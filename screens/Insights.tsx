import { useMemo } from "react";
import { useCollection } from "../lib/hooks";
import type { DailyCheckIn, JournalEntry, LifeDimension, StandardStatement } from "../types";

/** Insights — gentle, manual, derived only from what she actually recorded.
 *  No AI, no scores, no diagnosis, no causation claims (§8).
 *  Private and intimate entries are excluded from every count.
 */
export default function Insights() {
  const checkins = useCollection<DailyCheckIn>("checkins");
  const entries = useCollection<JournalEntry>("journal_entries");
  const dimensions = useCollection<LifeDimension>("dimensions");
  const statements = useCollection<StandardStatement>("standard_statements");

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const recent = checkins.filter((c) => c.date >= since);
  const shareable = entries.filter((e) => e.privateLevel === "standard" && !e.archived);

  const top = (key: "body" | "heart" | "mind" | "energy") => {
    const counts = new Map<string, number>();
    for (const c of recent) {
      const v = c[key];
      if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  };

  const dimensionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of recent) if (c.dimensionId) counts.set(c.dimensionId, (counts.get(c.dimensionId) ?? 0) + 1);
    for (const e of shareable) for (const id of e.dimensionIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, n]) => ({ name: dimensions.find((d) => d.id === id)?.name ?? "—", n }))
      .sort((a, b) => b.n - a.n);
  }, [recent, shareable, dimensions]);

  const receiving = recent.map((c) => c.receiving).filter(Boolean) as string[];
  const actions = recent.map((c) => c.lovingAction).filter(Boolean) as string[];
  const evidenceCount = statements.reduce((n, s) => n + (s.evidence?.length ?? 0), 0);

  const nothingYet = recent.length === 0 && shareable.length === 0;

  return (
    <div className="insights fade-in">
      <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>Insights</h1>
      <p className="quiet-note" style={{ marginBottom: 24 }}>
        Reflections from the last thirty days, drawn only from what you have written.
        Private and intimate entries are never included.
      </p>

      {nothingYet ? (
        <p className="quiet-note empty-state">
          There is nothing to reflect back yet. This page fills in quietly as you use the app —
          there is no pace you are meant to keep.
        </p>
      ) : (
        <div className="insight-grid">
          {(["body", "heart", "mind", "energy"] as const).map((k) => {
            const t = top(k);
            return (
              <section className="card" key={k}>
                <p className="label label--quiet">{k}</p>
                <p className="display promise-text">
                  {t ? `Most often: ${t[0].toLowerCase()}` : "Not enough noted yet."}
                </p>
                {t && <p className="quiet-note">{t[1]} of {recent.length} check-ins.</p>}
              </section>
            );
          })}

          <section className="card insight-wide">
            <p className="label label--quiet">Where your attention has been</p>
            {dimensionCounts.length ? (
              <ul className="plain-list">
                {dimensionCounts.slice(0, 5).map((d) => (
                  <li key={d.name}>{d.name} — {d.n} {d.n === 1 ? "time" : "times"}</li>
                ))}
              </ul>
            ) : <p className="quiet-note">No dimensions chosen yet.</p>}
            {dimensionCounts.length > 3 && (
              <p className="quiet-note" style={{ marginTop: 10 }}>
                Least attended: {dimensionCounts[dimensionCounts.length - 1].name}. Noticing is not a correction.
              </p>
            )}
          </section>

          <section className="card insight-wide">
            <p className="label label--quiet">What you have been available to receive</p>
            {receiving.length ? (
              <ul className="plain-list">{receiving.slice(-5).reverse().map((r, i) => <li key={i}>{r}</li>)}</ul>
            ) : <p className="quiet-note">Nothing written here yet.</p>}
          </section>

          <section className="card insight-wide">
            <p className="label label--quiet">Loving actions you chose</p>
            {actions.length ? (
              <ul className="plain-list">{actions.slice(-5).reverse().map((a, i) => <li key={i}>{a}</li>)}</ul>
            ) : <p className="quiet-note">Nothing written here yet.</p>}
          </section>

          <section className="card insight-wide">
            <p className="label label--quiet">Evidence of embodiment</p>
            <p className="display promise-text">
              {evidenceCount
                ? `${evidenceCount} ${evidenceCount === 1 ? "moment" : "moments"} recorded. This is what becoming looks like.`
                : "Nothing recorded yet — it counts even when no one sees it."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
