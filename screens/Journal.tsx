import { useMemo, useState } from "react";
import { useCollection } from "../lib/hooks";
import { put, remove, newId } from "../lib/store";
import { JOURNAL_PROMPTS } from "../lib/seed";
import type { JournalEntry, LifeDimension, PrivateLevel } from "../types";

const TEMPLATE = `My body is telling me:

My heart wants:

My mind is trying to convince me:

My wisdom knows:

The truth beneath the noise is:

Today I will honor that truth by:

What I am willing to let come to me:
`;

const PROMPT_SETS = [
  "Morning alignment", "Evening return", "Heart vs. mind", "Receiving",
  "Identity embodiment", "Decision discernment", "Spiritual reflection",
  "Future-self visualization", "Gratitude and evidence of abundance", "Rest and restoration",
];

export default function Journal() {
  const entries = useCollection<JournalEntry>("journal_entries");
  const dimensions = useCollection<LifeDimension>("dimensions");
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [tab, setTab] = useState<"write" | "guided" | "archive">("archive");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((e) => e.archived === showArchived)
      .filter((e) => !q || (e.title ?? "").toLowerCase().includes(q) || e.content.toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [entries, query, showArchived]);

  function blank(promptType?: string, content = ""): JournalEntry {
    const iso = new Date().toISOString();
    return {
      id: newId(), createdAt: iso, updatedAt: iso, content, promptType,
      tags: [], dimensionIds: [], favorite: false,
      privateLevel: "standard", archived: false,
    };
  }

  if (editing) {
    return (
      <Editor
        entry={editing}
        dimensions={dimensions}
        onDone={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="journal fade-in">
      <div className="row-between" style={{ marginBottom: 20 }}>
        <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>Journal</h1>
        <div className="pill-row">
          <button className="pill" onClick={() => setEditing(blank())}>Free write</button>
          <button className="pill" onClick={() => setEditing(blank("Core template", TEMPLATE))}>
            Use the template
          </button>
        </div>
      </div>

      <div className="tab-row" role="tablist">
        {(["archive", "guided", "write"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab-link ${tab === t ? "tab-link--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "archive" ? "Entries" : t === "guided" ? "Guided reflection" : "Voice note"}
          </button>
        ))}
      </div>

      {tab === "guided" && (
        <section className="card" style={{ marginTop: 20 }}>
          <p className="label label--quiet">Choose a beginning</p>
          <div className="prompt-list">
            {JOURNAL_PROMPTS.map((p) => (
              <button key={p} className="prompt-item" onClick={() => setEditing(blank("Guided", p + "\n\n"))}>
                {p}
              </button>
            ))}
          </div>
          <p className="label label--quiet" style={{ marginTop: 20 }}>Prompt sets</p>
          <div className="pill-row">
            {PROMPT_SETS.map((s) => (
              <button key={s} className="pill" onClick={() => setEditing(blank(s))}>{s}</button>
            ))}
          </div>
        </section>
      )}

      {tab === "write" && (
        <section className="card" style={{ marginTop: 20 }}>
          <p className="label label--quiet">Voice note</p>
          <p className="quiet-note">
            Recording and transcription are not built yet — this is a placeholder for a
            future version, not a working feature. For now, writing is the way in.
          </p>
        </section>
      )}

      {tab === "archive" && (
        <>
          <div className="filter-row">
            <input
              placeholder="Search your writing"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search your writing"
            />
            <button className="pill" aria-pressed={showArchived} onClick={() => setShowArchived(!showArchived)}>
              {showArchived ? "Viewing archive" : "View archive"}
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="quiet-note empty-state">
              Nothing has been written here yet. Begin when something is ready to be heard.
            </p>
          ) : (
            <ul className="entry-list">
              {visible.map((e) => (
                <li key={e.id} className="card entry-card">
                  <div className="row-between">
                    <div>
                      <p className="label label--quiet">
                        {new Date(e.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                        {e.promptType ? ` · ${e.promptType}` : ""}
                        {e.privateLevel !== "standard" ? " · private" : ""}
                      </p>
                      {e.title && <p className="display entry-title">{e.title}</p>}
                    </div>
                    <button className="btn-quiet" onClick={() => setEditing(e)}>Open</button>
                  </div>
                  <p className="entry-excerpt">
                    {e.privateLevel === "intimate"
                      ? "This entry is kept private."
                      : e.content.slice(0, 220) + (e.content.length > 220 ? "…" : "")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Editor({
  entry, dimensions, onDone,
}: {
  entry: JournalEntry; dimensions: LifeDimension[]; onDone: () => void;
}) {
  const [draft, setDraft] = useState(entry);
  const [saved, setSaved] = useState<string | null>(null);

  async function persist(next: Partial<JournalEntry> = {}) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    await put("journal_entries", merged);
    setSaved("Saved");
    setTimeout(() => setSaved(null), 1600);
  }

  return (
    <div className="editor fade-in">
      <div className="practice-top">
        <button className="btn-quiet" onClick={async () => { await persist(); onDone(); }}>
          Done
        </button>
        <span className="quiet-note" role="status">{saved ?? ""}</span>
      </div>

      <input
        className="editor-title display"
        placeholder="Title, if one wants to exist"
        value={draft.title ?? ""}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        onBlur={() => void persist()}
        aria-label="Title"
      />
      <textarea
        className="editor-body"
        rows={18}
        value={draft.content}
        placeholder="Begin when something is ready to be heard."
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        onBlur={() => void persist()}
        aria-label="Entry"
      />

      <div className="editor-meta">
        <div>
          <p className="label label--quiet">Life dimension</p>
          <div className="pill-row">
            {dimensions.filter((d) => d.visible).map((d) => (
              <button
                key={d.id}
                className="pill"
                aria-pressed={draft.dimensionIds.includes(d.id)}
                onClick={() => void persist({
                  dimensionIds: draft.dimensionIds.includes(d.id)
                    ? draft.dimensionIds.filter((x) => x !== d.id)
                    : [...draft.dimensionIds, d.id],
                })}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label label--quiet">Privacy</p>
          <div className="pill-row">
            {(["standard", "private", "intimate"] as PrivateLevel[]).map((p) => (
              <button
                key={p}
                className="pill"
                aria-pressed={draft.privateLevel === p}
                onClick={() => void persist({ privateLevel: p })}
              >
                {p === "standard" ? "Standard" : p === "private" ? "Private" : "Private — intimate"}
              </button>
            ))}
          </div>
          <p className="quiet-note" style={{ marginTop: 8 }}>
            Private and intimate entries never appear in previews, quotes, or insights.
          </p>
        </div>

        <div className="pill-row">
          <button className="pill" aria-pressed={draft.favorite} onClick={() => void persist({ favorite: !draft.favorite })}>
            {draft.favorite ? "Favorited" : "Favorite"}
          </button>
          <button className="pill" onClick={() => void persist({ archived: !draft.archived })}>
            {draft.archived ? "Restore from archive" : "Archive"}
          </button>
          <button
            className="pill"
            onClick={async () => {
              if (confirm("Delete this entry? Archiving keeps it without showing it.")) {
                await remove("journal_entries", draft.id);
                onDone();
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
