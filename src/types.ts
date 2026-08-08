/** The Standard — typed data models (build brief §12, extended per revised brief).
 *  All records carry a schemaVersion so future migrations are clean.
 *  updatedAt is the sync conflict key: last-write-wins per record.
 */

export const SCHEMA_VERSION = 1;

export type PrivateLevel = "standard" | "private" | "intimate";

export interface Syncable {
  id: string;
  updatedAt: string; // ISO
  deleted?: boolean; // tombstone for sync
}

export interface LifeDimension extends Syncable {
  name: string;
  icon?: string;
  color?: string;
  visible: boolean;
  order: number;
}

export interface DailyCheckIn extends Syncable {
  date: string; // YYYY-MM-DD
  body?: string;
  heart?: string;
  mind?: string;
  energy?: string;
  note?: string;
  truth?: string;
  receiving?: string;
  lovingAction?: string;
  intention?: string;
  dimensionId?: string;
}

export interface JournalEntry extends Syncable {
  createdAt: string;
  title?: string;
  content: string;
  promptType?: string;
  tags: string[];
  dimensionIds: string[];
  favorite: boolean;
  privateLevel: PrivateLevel;
  archived: boolean;
}

export interface DecisionReflection extends Syncable {
  createdAt: string;
  decision: string;
  body: string;
  heart: string;
  mind: string;
  facts: string;
  unknowns: string;
  values: string;
  nextStep: string;
  timing: "act" | "ask" | "gather" | "wait" | "unclear";
}

export interface StandardStatement extends Syncable {
  category: "principle" | "identity" | "faith" | "receiving";
  text: string;
  favorite: boolean;
  archived: boolean;
  order: number;
  evidence?: string[];
}

export interface VisionTile extends Syncable {
  type: "image" | "text" | "quote" | "color";
  content: string;
  imagePath?: string; // Supabase Storage path; image bytes cached locally in IndexedDB
  caption?: string;
  whyItMatters?: string;
  dimensionId?: string;
  size: "small" | "medium" | "feature";
  order: number;
  favorite: boolean;
  archived: boolean;
}

export interface FutureScene extends Syncable {
  title: string;
  content: string;
  dimensionIds: string[];
  favorite: boolean;
  createdAt: string;
}

export interface EveningReturn extends Syncable {
  date: string; // YYYY-MM-DD
  mostMyself?: string;
  beganToOverride?: string;
  received?: string;
  bodyMadeClear?: string;
  proudOfHonoring?: string;
  releasedToGod?: string;
  completeForToday?: string;
}

export interface ExpansionLog extends Syncable {
  createdAt: string;
  subject: string;
  subjectType: "person" | "opportunity" | "environment" | "decision" | "other";
  state:
    | "expanded"
    | "peaceful"
    | "neutral"
    | "contracted"
    | "activated"
    | "depleted";
  context: string; // always required — a single sensation is never treated as proof
}

export interface UserProfile extends Syncable {
  preferredName: string;
  personalPromise: string;
  embodiedQualities: string[];
  availableToReceive: string[];
  ritualTime?: string; // stored for future reminder support; unused for now
  reminderPreference?: string;
  onboardingComplete: boolean;
}

/** Entity registry — table names shared between the local store and Supabase. */
export const ENTITIES = {
  dimensions: "dimensions",
  checkins: "checkins",
  journal_entries: "journal_entries",
  decisions: "decisions",
  standard_statements: "standard_statements",
  vision_tiles: "vision_tiles",
  future_scenes: "future_scenes",
  evening_returns: "evening_returns",
  expansion_logs: "expansion_logs",
  profile: "profile",
} as const;

export type EntityName = keyof typeof ENTITIES;
