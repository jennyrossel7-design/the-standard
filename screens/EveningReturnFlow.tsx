import { useState } from "react";
import { useCollection, todayKey } from "../lib/hooks";
import { put, newId } from "../lib/store";
import type { EveningReturn } from "../types";

const QUESTIONS: { key: keyof EveningReturn; q: string; sub?: string }[] = [
  { key: "mostMyself", q: "Where did I feel most like myself today?" },
  { key: "beganToOverride", q: "Where did I begin to override myself?", sub: "Noticing is not the same as failing." },
  { key: "received", q: "What did I receive?" },
  { key: "bodyMadeClear", q: "What did my body make clear?" },
  { key: "proudOfHonoring", q: "What am I proud of honoring?" },
  { key: "releasedToGod", q: "What can I release to God tonight?" },
  { key: "completeForToday", q: "What is complete for today?" },
];

export default function EveningReturnFlow({ onClose }: { onClose: () => void }) {
  const returns = useCollection<EveningReturn>("evening_returns");
  const key = todayKey();
  const existing = returns.find((r) => r.date === key);
  const [draft, setDraft] = useState<EveningReturn>(
    existing ?? { id: newId(), date: key, updatedAt: new Date().toISOString() }
  );
  const [done, setDone] = useState(false);

  async function save(next: Partial<EveningReturn> = {}) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    await put("evening_returns", merged);
  }

  if (done) {
    return (
      <div className="practice fade-in">
        <div className="practice-body closing">
          <h2 className="display" style={{ fontSize: "var(--size-h1)" }}>
            Nothing else is required of you tonight. Return to rest.
          </h2>
          <button className="btn-primary" style={{ marginTop: 32 }} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="practice fade-in">
      <div className="practice-top">
        <button className="btn-quiet" onClick={async () => { await save(); onClose(); }}>
          Save &amp; exit
        </button>
        <span className="label label--quiet">Evening return</span>
      </div>
      <div className="practice-body">
        <h2 style={{ fontSize: "var(--size-h2)", marginBottom: 24 }}>
          The day is closing.
        </h2>
        {QUESTIONS.map((item) => (
          <div key={String(item.key)} style={{ marginBottom: 24 }}>
            <label className="evening-q">
              <span className="display">{item.q}</span>
              {item.sub && <span className="quiet-note"> {item.sub}</span>}
              <textarea
                rows={2}
                defaultValue={(draft[item.key] as string) ?? ""}
                onBlur={(e) => void save({ [item.key]: e.target.value } as Partial<EveningReturn>)}
              />
            </label>
          </div>
        ))}
        <div className="practice-actions">
          <div className="spacer" />
          <button className="btn-primary" onClick={async () => { await save(); setDone(true); }}>
            Complete the day
          </button>
        </div>
      </div>
    </div>
  );
}
