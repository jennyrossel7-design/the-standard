import { useMemo, useState } from "react";
import { useCollection } from "../lib/hooks";
import { put, remove, newId } from "../lib/store";
import { FUTURE_SELF } from "../lib/seed";
import type { StandardStatement } from "../types";

const TABS: { key: StandardStatement["category"]; label: string; blurb: string }[] = [
  { key: "principle", label: "My Standard", blurb: "How you move, in your own words." },
  { key: "identity", label: "Identity", blurb: "Who you are being, not what you completed." },
  { key: "faith", label: "Faith", blurb: "Prayer, surrender, gratitude, discernment." },
  { key: "receiving", label: "Receiving", blurb: "What you are available for, and what has arrived." },
];

export default function Standard() {
  const statements = useCollection<StandardStatement>("standard_statements");
  const [tab, setTab] = useState<StandardStatement["category"]>("principle");
  const [showArchived, setShowArchived] = useState(false);
  const [reading, setReading] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState<StandardStatement | null>(null);

  const rows = useMemo(
    () => statements
      .filter((s) => s.category === tab && s.archived === showArchived)
      .sort((a, b) => a.order - b.order),
    [statements, tab, showArchived]
  );

  async function move(s: StandardStatement, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.id === s.id);
    const swap = rows[idx + dir];
    if (!swap) return;
    await put("standard_statements", { ...s, order: swap.order });
    await put("standard_statements", { ...swap, order: s.order });
  }

  async function add() {
    const iso = new Date().toISOString();
    await put("standard_statements", {
      id: newId(), updatedAt: iso, category: tab, text: "",
      favorite: false, archived: false, order: rows.length,
    } as StandardStatement);
  }

  if (reading) {
    const all = statements
      .filter((s) => !s.archived && (s.category === "principle" || s.category === "identity"))
      .sort((a, b) => a.order - b.order);
    return (
      <div className="reading fade-in">
        <button className="btn-quiet sanctuary-close" onClick={() => setReading(false)}>Close</button>
        <div className="reading-inner">
          <p className="label">My Standard</p>
          {all.map((s) => (
            <p key={s.id} className="display reading-para">{s.text}</p>
          ))}
          <p className="display reading-para reading-future">{FUTURE_SELF}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="standard fade-in">
      <div className="row-between" style={{ marginBottom: 6 }}>
        <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>The Standard</h1>
        <button className="btn-primary" onClick={() => setReading(true)}>Read my Standard</button>
      </div>

      <div className="tab-row" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`tab-link ${tab === t.key ? "tab-link--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="quiet-note" style={{ margin: "10px 0 20px" }}>
        {TABS.find((t) => t.key === tab)?.blurb}
      </p>

      {tab === "identity" && !showArchived && (
        <section className="card" style={{ marginBottom: 18 }}>
          <p className="label label--quiet">Future-self statement</p>
          <p className="display promise-text">{FUTURE_SELF}</p>
        </section>
      )}

      <ul className="statement-list">
        {rows.map((s, i) => (
          <li key={s.id} className="card statement-card">
            <textarea
              rows={2}
              defaultValue={s.text}
              placeholder="Write it in your own words."
              onBlur={(e) => void put("standard_statements", { ...s, text: e.target.value })}
              aria-label="Statement"
            />
            <div className="statement-actions">
              <button className="btn-quiet" aria-label="Move up" disabled={i === 0} onClick={() => void move(s, -1)}>↑</button>
              <button className="btn-quiet" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(s, 1)}>↓</button>
              <button className="btn-quiet" onClick={() => void put("standard_statements", { ...s, favorite: !s.favorite })}>
                {s.favorite ? "Favorited" : "Favorite"}
              </button>
              <button className="btn-quiet" onClick={() => setEvidenceFor(s)}>
                Evidence{s.evidence?.length ? ` (${s.evidence.length})` : ""}
              </button>
              <button className="btn-quiet" onClick={() => void put("standard_statements", { ...s, archived: !s.archived })}>
                {s.archived ? "Restore" : "Archive"}
              </button>
              <button
                className="btn-quiet"
                onClick={async () => { if (confirm("Remove this statement?")) await remove("standard_statements", s.id); }}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="pill-row" style={{ marginTop: 16 }}>
        <button className="pill" onClick={() => void add()}>Add a statement</button>
        <button className="pill" aria-pressed={showArchived} onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Viewing archive" : "View archive"}
        </button>
      </div>

      {evidenceFor && <Evidence statement={evidenceFor} onClose={() => setEvidenceFor(null)} />}
    </div>
  );
}

function Evidence({ statement, onClose }: { statement: StandardStatement; onClose: () => void }) {
  const [text, setText] = useState("");
  const evidence = statement.evidence ?? [];
  return (
    <div className="sheet" role="dialog" aria-label="Evidence of embodiment">
      <div className="sheet-inner card">
        <div className="row-between">
          <p className="label label--quiet">Evidence of embodiment</p>
          <button className="btn-quiet" onClick={onClose}>Done</button>
        </div>
        <p className="display promise-text">{statement.text}</p>
        <textarea
          rows={2}
          placeholder="“I rested when my body asked.” “I asked directly instead of assuming.”"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New evidence"
        />
        <button
          className="pill"
          disabled={!text.trim()}
          onClick={async () => {
            await put("standard_statements", { ...statement, evidence: [...evidence, text.trim()] });
            setText("");
          }}
        >
          Record it
        </button>
        {evidence.length > 0 && (
          <>
            <p className="quiet-note" style={{ marginTop: 18 }}>This is what becoming looks like.</p>
            <ul className="evidence-list">
              {evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
