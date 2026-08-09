import { useMemo, useState } from "react";
import { useCollection, todayKey, greeting, longDate } from "../lib/hooks";
import { put, newId } from "../lib/store";
import { CORE_PROMISE } from "../lib/seed";
import type { DailyCheckIn, EveningReturn, StandardStatement, UserProfile, VisionTile } from "../types";
import Practice from "./Practice";
import EveningReturnFlow from "./EveningReturnFlow";

const CHANNELS = [
  { key: "body" as const, label: "Body", options: ["Open", "Neutral", "Tense", "Depleted"] },
  { key: "heart" as const, label: "Heart", options: ["Peaceful", "Tender", "Hopeful", "Guarded", "Unclear"] },
  { key: "mind" as const, label: "Mind", options: ["Quiet", "Focused", "Busy", "Looping", "Foggy"] },
  { key: "energy" as const, label: "Energy", options: ["Rested", "Steady", "Activated", "Low"] },
];

export default function Today() {
  const checkins = useCollection<DailyCheckIn>("checkins");
  const evenings = useCollection<EveningReturn>("evening_returns");
  const statements = useCollection<StandardStatement>("standard_statements");
  const tiles = useCollection<VisionTile>("vision_tiles");
  const profiles = useCollection<UserProfile>("profile");
  const [flow, setFlow] = useState<"none" | "practice" | "evening">("none");
  const [principleIndex, setPrincipleIndex] = useState(0);

  const key = todayKey();
  const today = checkins.find((c) => c.date === key);
  const evening = evenings.find((e) => e.date === key);
  const profile = profiles[0];
  const promise = profile?.personalPromise || CORE_PROMISE;

  const principles = useMemo(
    () => statements.filter((s) => s.category === "principle" && !s.archived),
    [statements]
  );
  const principle = principles.length
    ? principles[principleIndex % principles.length]
    : undefined;

  async function setChannel(channel: "body" | "heart" | "mind" | "energy", value: string) {
    const base: DailyCheckIn = today ?? {
      id: newId(), date: key, updatedAt: new Date().toISOString(),
    };
    const next = { ...base, [channel]: base[channel] === value ? undefined : value };
    await put("checkins", next);
  }

  async function setField(field: "note" | "receiving", value: string) {
    const base: DailyCheckIn = today ?? {
      id: newId(), date: key, updatedAt: new Date().toISOString(),
    };
    await put("checkins", { ...base, [field]: value });
  }

  if (flow === "practice") return <Practice onClose={() => setFlow("none")} />;
  if (flow === "evening") return <EveningReturnFlow onClose={() => setFlow("none")} />;

  const previewTiles = tiles.filter((t) => !t.archived).slice(0, 4);

  return (
    <div className="today fade-in">
      <p className="label label--quiet">{longDate()}</p>
      <h1 style={{ fontSize: "var(--size-h1)", margin: "8px 0 32px" }}>{greeting()}</h1>

      <div className="today-grid">
        <div className="today-main">
          <section className="card" aria-labelledby="promise-h">
            <p className="label" id="promise-h">My promise</p>
            <p className="display promise-text">{promise}</p>
          </section>

          <section className="card" aria-labelledby="arriving-h">
            <p className="label label--quiet" id="arriving-h">How are you arriving?</p>
            <p className="quiet-note">There is no correct way to arrive.</p>
            {CHANNELS.map((c) => (
              <div className="channel-row" key={c.key}>
                <span className="channel-label">{c.label}</span>
                <div className="pill-row">
                  {c.options.map((o) => (
                    <button
                      key={o}
                      className="pill"
                      aria-pressed={today?.[c.key] === o}
                      onClick={() => void setChannel(c.key, o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <input
              className="quiet-input"
              placeholder="A private note, if one is needed"
              defaultValue={today?.note ?? ""}
              onBlur={(e) => void setField("note", e.target.value)}
              aria-label="A private note"
            />
          </section>

          <section className="card card--sand practice-card">
            <p className="display practice-invite">
              Five to ten unhurried minutes. Skippable at every step.
            </p>
            <button className="btn-primary" onClick={() => setFlow("practice")}>
              {today?.intention ? "Revisit today’s practice" : "Begin Today’s Practice"}
            </button>
          </section>

          {today?.intention && (
            <section className="card" aria-labelledby="intention-h">
              <p className="label" id="intention-h">Today’s intention</p>
              <p className="display promise-text">{today.intention}</p>
              <button
                className="btn-quiet"
                onClick={() => void navigator.clipboard?.writeText(today.intention ?? "")}
              >
                Copy
              </button>
            </section>
          )}
        </div>

        <div className="today-side">
          <section className="card" aria-labelledby="vision-h">
            <p className="label label--quiet" id="vision-h">Vision</p>
            {previewTiles.length ? (
              <div className="vision-preview">
                {previewTiles.map((t) => (
                  <div className="vision-preview-tile" key={t.id}>
                    <span>{t.caption || t.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="quiet-note">
                Your board is waiting. Add an image or a few words whenever something
                feels true.
              </p>
            )}
          </section>

          {principle && (
            <section className="card" aria-labelledby="principle-h">
              <div className="row-between">
                <p className="label label--quiet" id="principle-h">A principle for today</p>
                <button className="btn-quiet" onClick={() => setPrincipleIndex((i) => i + 1)}>
                  Another
                </button>
              </div>
              <p className="display promise-text">{principle.text}</p>
            </section>
          )}

          <section className="card" aria-labelledby="receive-h">
            <p className="label label--quiet" id="receive-h">Available to receive</p>
            <input
              className="quiet-input"
              placeholder="Today, I am available to receive…"
              defaultValue={today?.receiving ?? ""}
              onBlur={(e) => void setField("receiving", e.target.value)}
              aria-label="Available to receive"
            />
          </section>

          <section className="card" aria-labelledby="evening-h">
            <p className="label label--quiet" id="evening-h">Evening return</p>
            <p className="quiet-note">
              Three to five minutes, when the day is closing. Optional, always.
            </p>
            <button className="pill" onClick={() => setFlow("evening")}>
              {evening ? "Revisit the evening return" : "Begin the evening return"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
