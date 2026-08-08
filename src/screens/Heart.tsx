import { useState } from "react";
import { useCollection } from "../lib/hooks";
import { put, newId } from "../lib/store";
import type { DecisionReflection, ExpansionLog } from "../types";

const CHANNELS = [
  { name: "Body", role: "Sensation and capacity", example: "“My chest feels open.” “I am depleted.”" },
  { name: "Heart", role: "Desire, values, grief, love, truth", example: "“I want this.” “This does not feel like me.”" },
  { name: "Mind", role: "Analysis, planning, prediction — in service, not in command", example: "“Here is what could happen.”" },
  { name: "Wisdom", role: "Integrated, grounded choice", example: "“This is how I can honor the truth safely.”" },
];

const STATES: ExpansionLog["state"][] = [
  "expanded", "peaceful", "neutral", "contracted", "activated", "depleted",
];

export default function Heart() {
  const [view, setView] = useState<"home" | "practice" | "compass">("home");
  if (view === "practice") return <ThreeMinute onClose={() => setView("home")} />;
  if (view === "compass") return <Compass onClose={() => setView("home")} />;
  return <HeartHome onOpen={setView} />;
}

function HeartHome({ onOpen }: { onOpen: (v: "practice" | "compass") => void }) {
  const logs = useCollection<ExpansionLog>("expansion_logs");
  const [subject, setSubject] = useState("");
  const [subjectType, setSubjectType] = useState<ExpansionLog["subjectType"]>("person");
  const [state, setState] = useState<ExpansionLog["state"] | null>(null);
  const [context, setContext] = useState("");

  const canLog = subject.trim() && state && context.trim();

  async function log() {
    if (!canLog) return;
    const iso = new Date().toISOString();
    await put("expansion_logs", {
      id: newId(), createdAt: iso, updatedAt: iso,
      subject: subject.trim(), subjectType, state: state!, context: context.trim(),
    } as ExpansionLog);
    setSubject(""); setState(null); setContext("");
  }

  return (
    <div className="heart fade-in">
      <h1 className="display" style={{ fontSize: "var(--size-h1)" }}>Heart</h1>
      <p className="quiet-note" style={{ marginBottom: 28 }}>
        Four sources of inner information. None of them is the enemy, and none of them is infallible.
      </p>

      <div className="channel-grid">
        {CHANNELS.map((c) => (
          <section className="card" key={c.name}>
            <h2 className="display" style={{ fontSize: "19px" }}>{c.name}</h2>
            <p className="quiet-note">{c.role}</p>
            <p className="display channel-example">{c.example}</p>
          </section>
        ))}
      </div>

      <div className="two-up">
        <section className="card card--sand">
          <h2 className="display" style={{ fontSize: "21px" }}>Three-minute heart practice</h2>
          <p className="quiet-note">
            A hand over the chest, three natural breaths, one honest answer. The timer is optional.
          </p>
          <button className="btn-primary" onClick={() => onOpen("practice")}>Begin</button>
        </section>

        <section className="card card--ink">
          <h2 className="display" style={{ fontSize: "21px" }}>Decision Compass</h2>
          <p className="quiet-note quiet-note--inverse">
            For one specific choice. Your own words, sorted gently — what is true, what is
            known, what can wait.
          </p>
          <button className="btn-gold" onClick={() => onOpen("compass")}>Open the compass</button>
        </section>
      </div>

      <section className="card" style={{ marginTop: 24 }}>
        <p className="label label--quiet">Expansion &amp; contraction</p>
        <p className="quiet-note">
          Notice how a person, opportunity, environment, or decision leaves you. One sensation
          is information, not a verdict — context is always asked for.
        </p>
        <div className="filter-row">
          <input
            placeholder="Who or what?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            aria-label="Who or what"
          />
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value as ExpansionLog["subjectType"])}
            aria-label="Type"
          >
            <option value="person">A person</option>
            <option value="opportunity">An opportunity</option>
            <option value="environment">An environment</option>
            <option value="decision">A decision</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div className="pill-row" style={{ marginTop: 12 }}>
          {STATES.map((s) => (
            <button key={s} className="pill" aria-pressed={state === s} onClick={() => setState(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          style={{ marginTop: 12 }}
          placeholder="Context — what was happening, and what else might explain it?"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          aria-label="Context"
        />
        <button className="pill" disabled={!canLog} onClick={() => void log()} style={{ marginTop: 12 }}>
          Log it
        </button>

        {logs.length > 0 && (
          <ul className="log-list">
            {logs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((l) => (
              <li key={l.id}>
                <span className="label label--quiet">{l.state}</span> — {l.subject}
                <span className="quiet-note"> · {l.context}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="safety-note">
        This practice supports emotional reflection. New or unusual chest pressure, pain,
        shortness of breath, sweating, nausea, or discomfort radiating to the arm, jaw,
        shoulder, or back requires medical attention — not interpretation as an emotional message.
      </p>
    </div>
  );
}

function ThreeMinute({ onClose }: { onClose: () => void }) {
  const steps = [
    "Place a hand gently over your chest.",
    "Take three natural, unforced breaths.",
    "Say: “I am here. I am listening. I will not override you.”",
    "Ask: “What is true for me right now?”",
    "Let the first honest answer be short.",
    "Ask: “What is one loving action that honors that truth?”",
  ];
  const [i, setI] = useState(0);
  return (
    <div className="practice fade-in">
      <div className="practice-top">
        <button className="btn-quiet" onClick={onClose}>Close</button>
        <span className="label label--quiet">{i + 1} of {steps.length}</span>
      </div>
      <div className="practice-body">
        <div className="breath-circle" aria-hidden="true" />
        <h2 className="display" style={{ fontSize: "var(--size-h2)", marginTop: 32 }}>{steps[i]}</h2>
        <div className="practice-actions">
          {i > 0 && <button className="btn-quiet" onClick={() => setI(i - 1)}>Back</button>}
          <div className="spacer" />
          <button
            className="btn-primary"
            onClick={() => (i === steps.length - 1 ? onClose() : setI(i + 1))}
          >
            {i === steps.length - 1 ? "Close" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

const COMPASS_FIELDS: { key: keyof DecisionReflection; q: string }[] = [
  { key: "decision", q: "What decision am I considering?" },
  { key: "body", q: "What does my body notice?" },
  { key: "heart", q: "What does my heart want or value?" },
  { key: "mind", q: "What is my mind predicting?" },
  { key: "facts", q: "What facts do I actually have?" },
  { key: "unknowns", q: "What remains unknown?" },
  { key: "values", q: "What would honor me without forcing the outcome?" },
  { key: "nextStep", q: "What is the smallest reversible next step?" },
];

function Compass({ onClose }: { onClose: () => void }) {
  const iso = new Date().toISOString();
  const [draft, setDraft] = useState<DecisionReflection>({
    id: newId(), createdAt: iso, updatedAt: iso,
    decision: "", body: "", heart: "", mind: "", facts: "",
    unknowns: "", values: "", nextStep: "", timing: "unclear",
  });
  const [summary, setSummary] = useState(false);

  if (summary) {
    return (
      <div className="practice fade-in">
        <div className="practice-top">
          <button className="btn-quiet" onClick={onClose}>Close</button>
          <span className="label label--quiet">Your words, sorted</span>
        </div>
        <div className="practice-body">
          <h2 className="display" style={{ fontSize: "var(--size-h1)", marginBottom: 24 }}>
            {draft.decision || "This decision"}
          </h2>
          <Summary label="What is true" text={[draft.body, draft.heart].filter(Boolean).join(" ")} />
          <Summary label="What is known" text={draft.facts} />
          <Summary label="What remains unknown" text={draft.unknowns} />
          <Summary
            label="The aligned next step"
            text={
              draft.nextStep
                ? `Based on what you wrote, the step most consistent with your stated values appears to be: ${draft.nextStep}`
                : "You have not named a next step yet — that is allowed."
            }
          />
          <Summary
            label="Permission to wait"
            text={
              draft.timing === "wait"
                ? "You said you can wait. Waiting is a decision, not an absence of one."
                : "If clarity has not arrived, you are allowed to gather more, ask directly, or wait."
            }
          />
          <div className="practice-actions">
            <button className="btn-quiet" onClick={() => setSummary(false)}>Back to my answers</button>
            <div className="spacer" />
            <button
              className="btn-primary"
              onClick={async () => { await put("decisions", draft); onClose(); }}
            >
              Save this reflection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="practice fade-in">
      <div className="practice-top">
        <button className="btn-quiet" onClick={onClose}>Close</button>
        <span className="label label--quiet">Decision Compass</span>
      </div>
      <div className="practice-body">
        {COMPASS_FIELDS.map((f) => (
          <div key={String(f.key)} style={{ marginBottom: 22 }}>
            <label>
              <span className="display compass-q">{f.q}</span>
              <textarea
                rows={2}
                value={(draft[f.key] as string) ?? ""}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            </label>
          </div>
        ))}
        <p className="label label--quiet">Does this need action now?</p>
        <div className="pill-row">
          {(["act", "ask", "gather", "wait", "unclear"] as DecisionReflection["timing"][]).map((t) => (
            <button key={t} className="pill" aria-pressed={draft.timing === t} onClick={() => setDraft({ ...draft, timing: t })}>
              {t === "act" ? "Act now" : t === "ask" ? "Ask directly" : t === "gather" ? "Gather information" : t === "wait" ? "I am allowed to wait" : "Not clear yet"}
            </button>
          ))}
        </div>
        <div className="practice-actions">
          <div className="spacer" />
          <button className="btn-primary" onClick={() => setSummary(true)}>See what you wrote</button>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, text }: { label: string; text: string }) {
  return (
    <section className="card" style={{ marginBottom: 14 }}>
      <p className="label label--quiet">{label}</p>
      <p className="display promise-text">{text || "Nothing written here yet — that is allowed."}</p>
    </section>
  );
}
