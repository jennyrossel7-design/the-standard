import { useEffect, useState } from "react";
import {
  PHOTO_MOODS, QUOTE_LIBRARY, COLOR_LIBRARY,
  searchPhotos, setUnsplashKey,
  type UnsplashPhoto,
} from "../lib/library";

/** Photo library — browse curated moods or search, then add with one click.
 *  Chosen images are cached on the device so the board keeps working offline. */
export function PhotoPicker({
  onPick, onClose,
}: {
  onPick: (photo: UnsplashPhoto) => Promise<void>;
  onClose: () => void;
}) {
  const [mood, setMood] = useState(PHOTO_MOODS[0]);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "no-key" | "bad-key" | "failed">("idle");
  const [keyDraft, setKeyDraft] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  async function run(q: string) {
    setStatus("loading");
    try {
      setPhotos(await searchPhotos(q));
      setStatus("idle");
    } catch (e) {
      const m = (e as Error).message;
      setStatus(m === "no-key" ? "no-key" : m === "bad-key" ? "bad-key" : "failed");
    }
  }

  useEffect(() => { void run(mood.query); /* eslint-disable-next-line */ }, [mood]);

  return (
    <div className="sheet" role="dialog" aria-label="Photo library">
      <div className="sheet-inner card sheet-wide">
        <div className="row-between">
          <p className="label label--quiet">Photo library</p>
          <button className="btn-quiet" onClick={onClose}>Close</button>
        </div>

        {(status === "no-key" || status === "bad-key") ? (
          <div>
            <p className="quiet-note">
              {status === "bad-key"
                ? "That key was not accepted. You can paste a different one below."
                : "To browse photographs here, this needs a free Unsplash key — it takes about two minutes and only has to be done once."}
            </p>
            <ol className="plain-list" style={{ listStyle: "decimal", paddingLeft: 18 }}>
              <li>Go to unsplash.com/oauth/applications and sign in.</li>
              <li>Choose “New Application,” accept the terms, and give it any name.</li>
              <li>Copy the value labeled <strong>Access Key</strong> and paste it here.</li>
            </ol>
            <input
              placeholder="Paste your Unsplash Access Key"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              aria-label="Unsplash access key"
            />
            <button
              className="pill"
              style={{ marginTop: 10 }}
              disabled={!keyDraft.trim()}
              onClick={() => { setUnsplashKey(keyDraft); void run(mood.query); }}
            >
              Save the key
            </button>
            <p className="quiet-note" style={{ marginTop: 12 }}>
              The key stays on this device. Photographs load from Unsplash; your own writing
              and uploads never leave your account.
            </p>
          </div>
        ) : (
          <>
            <div className="pill-row" style={{ marginTop: 12 }}>
              {PHOTO_MOODS.map((m) => (
                <button
                  key={m.label}
                  className="pill"
                  aria-pressed={mood.label === m.label && !query}
                  onClick={() => { setQuery(""); setMood(m); }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <form
              className="filter-row"
              onSubmit={(e) => { e.preventDefault(); if (query.trim()) void run(query.trim()); }}
            >
              <input
                placeholder="Or search for something specific"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search photographs"
              />
              <button className="pill" type="submit">Search</button>
            </form>

            {status === "loading" && <p className="quiet-note">Looking…</p>}
            {status === "failed" && (
              <p className="quiet-note">
                Unsplash could not be reached just now. Your own uploads still work.
              </p>
            )}

            <div className="picker-grid">
              {photos.map((p) => (
                <button
                  key={p.id}
                  className="picker-tile"
                  disabled={adding === p.id}
                  onClick={async () => {
                    setAdding(p.id);
                    await onPick(p);
                    setAdding(null);
                    onClose();
                  }}
                >
                  <img src={p.thumb} alt={p.alt || "Photograph"} loading="lazy" />
                  <span className="picker-credit">{adding === p.id ? "Adding…" : p.credit}</span>
                </button>
              ))}
            </div>
            {photos.length > 0 && (
              <p className="quiet-note" style={{ marginTop: 12 }}>
                Photographs from Unsplash. Each keeps its photographer’s name on the tile.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function QuotePicker({
  onPick, onClose,
}: {
  onPick: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const groups = [...new Set(QUOTE_LIBRARY.map((q) => q.group))];
  const [group, setGroup] = useState(groups[0]);
  const [custom, setCustom] = useState("");

  return (
    <div className="sheet" role="dialog" aria-label="Quote library">
      <div className="sheet-inner card sheet-wide">
        <div className="row-between">
          <p className="label label--quiet">Words</p>
          <button className="btn-quiet" onClick={onClose}>Close</button>
        </div>

        <div className="pill-row" style={{ marginTop: 12 }}>
          {groups.map((g) => (
            <button key={g} className="pill" aria-pressed={group === g} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>

        <ul className="quote-list">
          {QUOTE_LIBRARY.filter((q) => q.group === group).map((q) => (
            <li key={q.text}>
              <button
                className="quote-item"
                onClick={async () => {
                  await onPick(q.source ? `${q.text}\n— ${q.source}` : q.text);
                  onClose();
                }}
              >
                <span className="display">{q.text}</span>
                {q.source && <span className="quiet-note"> {q.source}</span>}
              </button>
            </li>
          ))}
        </ul>

        <p className="label label--quiet" style={{ marginTop: 18 }}>Or write your own</p>
        <textarea
          rows={2}
          value={custom}
          placeholder="Something true, in your words"
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Your own words"
        />
        <button
          className="pill"
          style={{ marginTop: 10 }}
          disabled={!custom.trim()}
          onClick={async () => { await onPick(custom.trim()); onClose(); }}
        >
          Add it
        </button>
      </div>
    </div>
  );
}

export function ColorPicker({
  onPick, onClose,
}: {
  onPick: (hex: string) => Promise<void>;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("#E8DED1");
  return (
    <div className="sheet" role="dialog" aria-label="Colors">
      <div className="sheet-inner card sheet-wide">
        <div className="row-between">
          <p className="label label--quiet">Colors</p>
          <button className="btn-quiet" onClick={onClose}>Close</button>
        </div>

        <div className="swatch-grid">
          {COLOR_LIBRARY.map((c) => (
            <button
              key={c.hex}
              className="swatch"
              onClick={async () => { await onPick(c.hex); onClose(); }}
              title={c.name}
              aria-label={c.name}
            >
              <span className="swatch-chip" style={{ background: c.hex }} />
              <span className="swatch-name">{c.name}</span>
            </button>
          ))}
        </div>

        <p className="label label--quiet" style={{ marginTop: 18 }}>Or choose your own</p>
        <div className="filter-row">
          <input
            type="color"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-label="Custom color"
            style={{ width: 64, padding: 4, height: 44 }}
          />
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-label="Custom color value"
            style={{ maxWidth: 140 }}
          />
          <button className="pill" onClick={async () => { await onPick(custom); onClose(); }}>
            Add it
          </button>
        </div>
      </div>
    </div>
  );
}
