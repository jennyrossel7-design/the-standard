import { useEffect, useMemo, useRef, useState } from "react";
import { useCollection } from "../lib/hooks";
import { put, remove, newId, putImage, getImage } from "../lib/store";
import { supabase } from "../lib/sync";
import type { FutureScene, LifeDimension, VisionTile } from "../types";
import { PhotoPicker, QuotePicker, ColorPicker } from "./VisionPickers";
import { registerDownload, type UnsplashPhoto } from "../lib/library";

const SCENE_PROMPTS = [
  "Where are you?",
  "What can you see, hear, smell, and feel?",
  "How does your body feel in this life?",
  "What are you no longer trying to prove?",
  "What support is present?",
  "What does an ordinary peaceful morning look like?",
  "How do love, work, health, faith, and home coexist?",
];

export default function Vision() {
  const [tab, setTab] = useState<"board" | "scenes">("board");
  const [sanctuary, setSanctuary] = useState(false);
  const tiles = useCollection<VisionTile>("vision_tiles");
  const active = useMemo(
    () => tiles.filter((t) => !t.archived).sort((a, b) => a.order - b.order),
    [tiles]
  );

  if (sanctuary) return <Sanctuary tiles={active} onClose={() => setSanctuary(false)} />;

  return (
    <div className="vision fade-in">
      <div className="row-between" style={{ marginBottom: 8 }}>
        <div className="row-left">
          <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>Vision</h1>
          <div className="tab-row" role="tablist">
            <button role="tab" aria-selected={tab === "board"} className={`tab-link ${tab === "board" ? "tab-link--active" : ""}`} onClick={() => setTab("board")}>Board</button>
            <button role="tab" aria-selected={tab === "scenes"} className={`tab-link ${tab === "scenes" ? "tab-link--active" : ""}`} onClick={() => setTab("scenes")}>Future scenes</button>
          </div>
        </div>
        {tab === "board" && active.length > 0 && (
          <button className="btn-primary" onClick={() => setSanctuary(true)}>View as sanctuary</button>
        )}
      </div>

      {tab === "board" ? <Board tiles={active} /> : <Scenes />}
    </div>
  );
}

function Board({ tiles }: { tiles: VisionTile[] }) {
  const dimensions = useCollection<LifeDimension>("dimensions");
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<VisionTile | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [picker, setPicker] = useState<"none" | "photo" | "quote" | "color">("none");

  async function addTile(
    type: VisionTile["type"], content = "", extra: Partial<VisionTile> = {}
  ) {
    const iso = new Date().toISOString();
    const tile: VisionTile = {
      id: newId(), updatedAt: iso, type, content,
      size: type === "image" ? "medium" : "small",
      order: tiles.length, favorite: false, archived: false,
      ...extra,
    };
    await put("vision_tiles", tile);
    return tile;
  }

  /** Add a photograph from the library: cache the bytes locally when possible so
   *  the board stays private and works offline, and keep the credit with the tile. */
  async function addFromLibrary(photo: UnsplashPhoto) {
    registerDownload(photo);
    const id = newId();
    const iso = new Date().toISOString();
    const base: VisionTile = {
      id, updatedAt: iso, type: "image", content: "",
      caption: photo.alt || undefined,
      credit: photo.credit, creditUrl: photo.creditUrl,
      size: "medium", order: tiles.length, favorite: false, archived: false,
    };
    try {
      const res = await fetch(photo.full);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const path = `${id}.jpg`;
      await putImage(path, blob);
      await put("vision_tiles", { ...base, imagePath: path });
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (uid) void supabase.storage.from("vision").upload(`${uid}/${path}`, blob, { upsert: true });
      }
    } catch {
      // Could not cache it — keep the remote image rather than failing.
      await put("vision_tiles", { ...base, imageUrl: photo.full });
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files).slice(0, 12)) {
      const iso = new Date().toISOString();
      const id = newId();
      const path = `${id}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
      await putImage(path, file);
      const tile: VisionTile = {
        id, updatedAt: iso, type: "image", content: "",
        imagePath: path, size: "medium", order: tiles.length,
        favorite: false, archived: false,
      };
      await put("vision_tiles", tile);
      // Upload in the background; the local copy is authoritative for display.
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (uid) void supabase.storage.from("vision").upload(`${uid}/${path}`, file, { upsert: true });
      }
    }
  }

  async function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ordered = [...tiles];
    const from = ordered.findIndex((t) => t.id === dragId);
    const to = ordered.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].order !== i) await put("vision_tiles", { ...ordered[i], order: i });
    }
    setDragId(null);
  }

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <p className="quiet-note">
          Drag tiles to rearrange. Click a tile to edit its size, dimension, and why it matters.
        </p>
        <div className="pill-row">
          <button className="pill" onClick={() => setPicker("photo")}>Photo library</button>
          <button className="pill" onClick={() => fileRef.current?.click()}>Upload my own</button>
          <button className="pill" onClick={() => setPicker("quote")}>Words</button>
          <button className="pill" onClick={() => setPicker("color")}>Colors</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void onFiles(e.target.files)}
          />
        </div>
      </div>

      {tiles.length === 0 ? (
        <p className="quiet-note empty-state">
          Nothing is here yet. Add an image, a few words, or a color that already feels like
          the life you are building.
        </p>
      ) : (
        <div className="vision-grid">
          {tiles.map((t) => (
            <div
              key={t.id}
              className={`vision-tile vision-tile--${t.size}`}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void reorder(t.id)}
              onClick={() => setEditing(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setEditing(t); }}
            >
              <TileContent tile={t} />
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TileEditor
          tile={editing}
          dimensions={dimensions}
          onClose={() => setEditing(null)}
        />
      )}

      {picker === "photo" && (
        <PhotoPicker onPick={addFromLibrary} onClose={() => setPicker("none")} />
      )}
      {picker === "quote" && (
        <QuotePicker
          onPick={async (text) => { await addTile("quote", text); }}
          onClose={() => setPicker("none")}
        />
      )}
      {picker === "color" && (
        <ColorPicker
          onPick={async (hex) => { await addTile("color", hex); }}
          onClose={() => setPicker("none")}
        />
      )}
    </>
  );
}

function TileContent({ tile }: { tile: VisionTile }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    if (tile.imagePath) {
      void getImage(tile.imagePath).then((blob) => {
        if (blob) { revoked = URL.createObjectURL(blob); setUrl(revoked); }
      });
    }
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, [tile.imagePath]);

  if (tile.type === "image") {
    const src = url ?? tile.imageUrl ?? null;
    if (!src) return <div className="tile-placeholder"><span>{tile.caption || "Image"}</span></div>;
    return (
      <>
        <img src={src} alt={tile.caption || "Vision board image"} />
        {tile.credit && <span className="tile-credit">{tile.credit}</span>}
      </>
    );
  }
  if (tile.type === "color") {
    return <div className="tile-color" style={{ background: tile.content || "var(--surface-sand)" }} />;
  }
  return (
    <div className={`tile-text ${tile.type === "quote" ? "tile-text--quote" : ""}`}>
      <span className="display">{tile.content || "Write something true."}</span>
    </div>
  );
}

function TileEditor({
  tile, dimensions, onClose,
}: { tile: VisionTile; dimensions: LifeDimension[]; onClose: () => void }) {
  const [draft, setDraft] = useState(tile);
  async function persist(next: Partial<VisionTile> = {}) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    await put("vision_tiles", merged);
  }
  return (
    <div className="sheet" role="dialog" aria-label="Edit tile">
      <div className="sheet-inner card">
        <div className="row-between">
          <p className="label label--quiet">Tile</p>
          <button className="btn-quiet" onClick={onClose}>Done</button>
        </div>

        {draft.type !== "image" && (
          <textarea
            rows={3}
            value={draft.content}
            placeholder={draft.type === "color" ? "#E8DED1" : "Words that feel true"}
            onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            onBlur={() => void persist()}
            aria-label="Tile content"
          />
        )}

        <input
          placeholder="Caption"
          value={draft.caption ?? ""}
          onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
          onBlur={() => void persist()}
          aria-label="Caption"
        />
        <textarea
          rows={2}
          placeholder="Why this matters to me"
          value={draft.whyItMatters ?? ""}
          onChange={(e) => setDraft({ ...draft, whyItMatters: e.target.value })}
          onBlur={() => void persist()}
          aria-label="Why this matters to me"
        />

        <p className="label label--quiet">Size</p>
        <div className="pill-row">
          {(["small", "medium", "feature"] as VisionTile["size"][]).map((s) => (
            <button key={s} className="pill" aria-pressed={draft.size === s} onClick={() => void persist({ size: s })}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <p className="label label--quiet">Life dimension</p>
        <div className="pill-row">
          {dimensions.filter((d) => d.visible).map((d) => (
            <button
              key={d.id}
              className="pill"
              aria-pressed={draft.dimensionId === d.id}
              onClick={() => void persist({ dimensionId: draft.dimensionId === d.id ? undefined : d.id })}
            >
              {d.name}
            </button>
          ))}
        </div>

        <div className="pill-row" style={{ marginTop: 16 }}>
          <button className="pill" aria-pressed={draft.favorite} onClick={() => void persist({ favorite: !draft.favorite })}>
            {draft.favorite ? "Favorited" : "Favorite"}
          </button>
          <button className="pill" onClick={async () => { await persist({ archived: true }); onClose(); }}>
            Archive
          </button>
          <button
            className="pill"
            onClick={async () => {
              if (confirm("Remove this tile?")) { await remove("vision_tiles", draft.id); onClose(); }
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Sanctuary({ tiles, onClose }: { tiles: VisionTile[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="sanctuary fade-in">
      <button className="btn-quiet sanctuary-close" onClick={onClose}>Close</button>
      <div className="sanctuary-grid">
        {tiles.map((t) => (
          <div key={t.id} className={`vision-tile vision-tile--${t.size}`}>
            <TileContent tile={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Scenes() {
  const scenes = useCollection<FutureScene>("future_scenes");
  const [editing, setEditing] = useState<FutureScene | null>(null);
  const [reading, setReading] = useState<FutureScene | null>(null);

  if (reading) {
    return (
      <div className="reading fade-in">
        <button className="btn-quiet sanctuary-close" onClick={() => setReading(null)}>Close</button>
        <div className="reading-inner">
          <h2 className="display reading-title">{reading.title}</h2>
          {reading.content.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="display reading-para">{para}</p>
          ))}
        </div>
      </div>
    );
  }

  if (editing) {
    return <SceneEditor scene={editing} onClose={() => setEditing(null)} />;
  }

  return (
    <>
      <div className="row-between" style={{ marginBottom: 16 }}>
        <p className="quiet-note">Write as if you are already living it.</p>
        <button
          className="pill"
          onClick={() => {
            const iso = new Date().toISOString();
            setEditing({
              id: newId(), createdAt: iso, updatedAt: iso,
              title: "", content: "", dimensionIds: [], favorite: false,
            });
          }}
        >
          New scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <p className="quiet-note empty-state">
          No scenes yet. Begin with an ordinary morning in the life you are creating.
        </p>
      ) : (
        <ul className="entry-list">
          {scenes.map((s) => (
            <li key={s.id} className="card entry-card">
              <div className="row-between">
                <p className="display entry-title">{s.title || "Untitled scene"}</p>
                <div className="pill-row">
                  <button className="btn-quiet" onClick={() => setReading(s)}>Read as visualization</button>
                  <button className="btn-quiet" onClick={() => setEditing(s)}>Edit</button>
                </div>
              </div>
              <p className="entry-excerpt">{s.content.slice(0, 200)}{s.content.length > 200 ? "…" : ""}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SceneEditor({ scene, onClose }: { scene: FutureScene; onClose: () => void }) {
  const [draft, setDraft] = useState(scene);
  async function persist(next: Partial<FutureScene> = {}) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    await put("future_scenes", merged);
  }
  return (
    <div className="editor fade-in">
      <div className="practice-top">
        <button className="btn-quiet" onClick={async () => { await persist(); onClose(); }}>Done</button>
      </div>
      <input
        className="editor-title display"
        placeholder="A name for this scene"
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        onBlur={() => void persist()}
        aria-label="Scene title"
      />
      <div className="scene-prompts">
        {SCENE_PROMPTS.map((p) => <span key={p} className="quiet-note">{p}</span>)}
      </div>
      <textarea
        className="editor-body"
        rows={16}
        value={draft.content}
        placeholder="It is an ordinary morning, and…"
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
        onBlur={() => void persist()}
        aria-label="Scene"
      />
      <div className="pill-row">
        <button className="pill" aria-pressed={draft.favorite} onClick={() => void persist({ favorite: !draft.favorite })}>
          {draft.favorite ? "Favorited" : "Favorite"}
        </button>
        <button
          className="pill"
          onClick={async () => {
            if (confirm("Remove this scene?")) { await remove("future_scenes", draft.id); onClose(); }
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
