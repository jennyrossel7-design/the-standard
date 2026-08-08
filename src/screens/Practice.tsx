import { useState } from "react";
import { useCollection, todayKey } from "../lib/hooks";
import { put, newId } from "../lib/store";
import type { DailyCheckIn, LifeDimension } from "../types";

/** The seven-step morning practice (§7.2). Skippable at every step;
 *  nothing is erased when moving between steps; exit and return is safe. */
export default function Practice({ onClose }: { onClose: () => void }) {
  const checkins = useCollection<DailyCheckIn>("checkins");
  const dimensions = useCollection<LifeDimension>("dimensions");
  const key = todayKey();
  const existing = checkins.find((c) => c.date === key);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DailyCheckIn>(
    existing ?? { id: newId(), date: key, updatedAt: new Date().toISOString() }
  );

  const visibleDims = dimensions.filter((d) => d.visible).sort((a, b) => a.order - b.order);

  async function save(next: Partial<DailyCheckIn> = {}) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    await put("checkins", merged);
    return merged;
  }

  function composeIntention(d: DailyCheckIn): string {
    const parts: string[] = [];
    const dim = visibleDims.find((x) => x.id === d.dimensionId);
    if (d.lovingAction?.trim()) parts.push(d.lovingAction.trim().replace(/\.$/, "") + ".");
    else if (dim) parts.push(`I am giving gentle attention to the ${dim.name.toLowerCase()} part of my life.`);
    if (d.receiving?.trim()) parts.push(`I am available to receive ${d.receiving.trim().replace(/\.$/, "")}.`);
    if (!parts.length && d.truth?.trim()) parts.push(d.truth.trim());
    return parts.join(" ") || "Today, I am simply here, listening.";
  }

  const steps = [
    {
      title: "Three natural breaths.",
      sub: "Let your shoulders soften. You are not behind, and nothing is being measured.",
      body: <div className="breath-circle" aria-hidden="true" />,
    },
    {
      title: "What is true for me right now?",
      sub: "Not what should be true. Not what you can defend. The first honest answer.",
      body: (
        <Field
          value={draft.truth ?? ""}
          onChange={(v) => setDraft({ ...draft, truth: v })}
          placeholder="The first honest answer."
          hint="“Not clear yet” is a complete answer"
        />
      ),
    },
    {
      title: "Body, heart, mind, wisdom.",
      sub: "Four sources of information. None is the enemy; none is infallible.",
      body: (
        <Field
          value={draft.note ?? ""}
          onChange={(v) => setDraft({ ...draft, note: v })}
          placeholder="What each one seems to be saying, in a sentence or two."
        />
      ),
    },
    {
      title: "Which part of your life needs care today?",
      sub: "One is enough.",
      body: (
        <div className="pill-row">
          {visibleDims.map((d) => (
            <button
              key={d.id}
              className="pill"
              aria-pressed={draft.dimensionId === d.id}
              onClick={() => setDraft({ ...draft, dimensionId: draft.dimensionId === d.id ? undefined : d.id })}
            >
              {d.name}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What am I willing to let come to me today?",
      sub: "Receiving is not passivity. You prepare, express, invite — and then allow.",
      body: (
        <Field
          value={draft.receiving ?? ""}
          onChange={(v) => setDraft({ ...draft, receiving: v })}
          placeholder="Rest, support, clarity, beauty, ease…"
        />
      ),
    },
    {
      title: "One small loving action.",
      sub: "Small and real is better than ambitious and abandoned.",
      body: (
        <Field
          value={draft.lovingAction ?? ""}
          onChange={(v) => setDraft({ ...draft, lovingAction: v })}
          placeholder="One thing that honors what you heard."
        />
      ),
    },
    {
      title: "Today’s intention.",
      sub: "Drawn only from what you wrote.",
      body: (
        <div className="card intention-preview">
          <p className="display promise-text">{composeIntention(draft)}</p>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="practice fade-in">
      <div className="practice-top">
        <button
          className="btn-quiet"
          onClick={async () => { await save(); onClose(); }}
        >
          Save &amp; exit
        </button>
        <span className="label label--quiet">{step + 1} of {steps.length}</span>
      </div>

      <div className="practice-body">
        <p className="label">Step {step + 1}</p>
        <h2 style={{ fontSize: "var(--size-h1)", margin: "10px 0 12px" }}>{current.title}</h2>
        <p className="quiet-note" style={{ marginBottom: 24 }}>{current.sub}</p>
        {current.body}

        <div className="practice-actions">
          {step > 0 && (
            <button className="btn-quiet" onClick={async () => { await save(); setStep(step - 1); }}>
              Back
            </button>
          )}
          <div className="spacer" />
          {!isLast && (
            <button className="btn-quiet" onClick={async () => { await save(); setStep(step + 1); }}>
              Skip this step
            </button>
          )}
          <button
            className="btn-primary"
            onClick={async () => {
              if (isLast) {
                await save({ intention: composeIntention(draft) });
                onClose();
              } else {
                await save();
                setStep(step + 1);
              }
            }}
          >
            {isLast ? "Save this intention" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  value, onChange, placeholder, hint,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; hint?: string;
}) {
  return (
    <div>
      <textarea
        rows={5}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {hint && <p className="quiet-note" style={{ marginTop: 8 }}>{hint}</p>}
    </div>
  );
}
