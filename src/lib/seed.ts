/** Seed content — verbatim from the build brief (§5, §13).
 *  Runs once on first launch; everything is editable and archivable afterward.
 */
import { all, put, newId, getMeta, setMeta } from "./store";
import type { LifeDimension, StandardStatement } from "../types";

const now = () => new Date().toISOString();

export const CORE_PROMISE =
  "I no longer override myself to perform and survive. I listen to my heart and let things come.";

export const FUTURE_SELF =
  "I am a calm, radiant, heart-led woman. I create consequential outcomes with composure and grace. My home restores me. My work expands me. My relationships are reciprocal. My body is listened to. My faith steadies me. I allow life to meet me with love, support, beauty, and abundance.";

const PRINCIPLES = [
  "I pause before I perform.",
  "I feel before I explain.",
  "I ask before I assume.",
  "I receive before I reach.",
  "I never use my intelligence to argue against my own knowing.",
  "I prepare, express, invite, and observe. I do not force.",
  "Relational reciprocity is non-negotiable.",
  "Consistency—not intensity—is the evidence I trust.",
  "Rest is part of my power; it is not a reward I earn through depletion.",
  "I allow trustworthy people to carry part of the load.",
  "I can be open without abandoning myself.",
  "I can be ambitious without living in strain.",
  "I let my intellect serve my heart, values, body, faith, and wisdom.",
  "I build a life that does not revolve around being chosen.",
  "I receive and accept care, love, opportunity, compliments, gifts, leadership, protection, and support that arrive with integrity.",
];

const IDENTITY = [
  "Receptive, not vigilant",
  "Discerning, not defensive",
  "Open, not porous",
  "Ambitious, not strained",
  "Sensuous, not performative",
  "Vulnerable, not self-abandoning",
  "Detached from outcomes, devoted to values",
  "Led by God, grounded in the body, supported by the mind",
  "Quietly powerful, emotionally available, and fully self-respecting",
];

const PRAYERS = [
  "God, quiet what is noise and strengthen what is true. Help me move with wisdom, receive with grace, and release what I was never meant to force.",
  "God, help me recognize the people, opportunities, and choices that carry peace, integrity, reciprocity, and life.",
  "Thank You for the life already holding me. Teach me to inhabit it fully.",
];

export const RECEIVING_CATEGORIES = [
  "Rest", "Support", "Love", "Opportunity", "Money", "Beauty", "Clarity",
  "Care", "Leadership", "Protection", "Play", "Partnership", "Ease",
];

const DIMENSIONS = [
  "Spiritual", "Emotional", "Physical", "Intellectual",
  "Professional & financial", "Relational", "Sensual & intimate", "Home & lifestyle",
];

export const JOURNAL_PROMPTS = [
  "What is true for me before I explain it away?",
  "Where is life already supporting me?",
  "What would I choose if I trusted I did not have to force what belongs to me?",
  "What does my body need in order to feel accompanied by me today?",
  "What am I trying to earn that I could allow myself to receive?",
  "Where did I feel graceful, powerful, and fully myself?",
  "What is the difference between an aligned stretch and self-abandonment here?",
  "What would calm leadership look like in this situation?",
  "What can I release to God instead of carrying overnight?",
  "What would an ordinary beautiful morning in my future life feel like?",
];

export async function ensureSeed(): Promise<void> {
  if (await getMeta<boolean>("seeded")) return;
  const existing = await all("standard_statements");
  if (existing.length === 0) {
    let order = 0;
    const mk = (category: StandardStatement["category"], text: string): StandardStatement => ({
      id: newId(), category, text, favorite: false, archived: false,
      order: order++, updatedAt: now(),
    });
    for (const t of PRINCIPLES) await put("standard_statements", mk("principle", t));
    for (const t of IDENTITY) await put("standard_statements", mk("identity", t));
    for (const t of PRAYERS) await put("standard_statements", mk("faith", t));
    for (const t of RECEIVING_CATEGORIES) await put("standard_statements", mk("receiving", t));
  }
  const dims = await all("dimensions");
  if (dims.length === 0) {
    for (let i = 0; i < DIMENSIONS.length; i++) {
      const d: LifeDimension = {
        id: newId(), name: DIMENSIONS[i], visible: true, order: i, updatedAt: now(),
      };
      await put("dimensions", d);
    }
  }
  await setMeta("seeded", true);
}
