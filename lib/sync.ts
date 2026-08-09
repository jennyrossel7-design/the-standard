/** Background sync with Supabase.
 *  - Push: drain the outbox (records changed locally since last sync).
 *  - Pull: fetch rows with updated_at newer than our high-water mark.
 *  - Conflict rule: last-write-wins per record on updatedAt (ISO string compare).
 *  The app never blocks on the network; sync runs after writes, on an interval,
 *  and when connectivity returns.
 */
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { db, put, getMeta, setMeta, subscribe } from "./store";
import { ENTITIES, type EntityName, type Syncable } from "../types";

// Injected at build time (vite env) — safe-to-publish public values.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

export type SyncState = "signed-out" | "idle" | "syncing" | "offline" | "error";

let state: SyncState = supabase ? "signed-out" : "offline";
let lastSync: Date | null = null;
const stateListeners = new Set<(s: SyncState, last: Date | null) => void>();

export function onSyncState(fn: (s: SyncState, last: Date | null) => void): () => void {
  stateListeners.add(fn);
  fn(state, lastSync);
  return () => stateListeners.delete(fn);
}

function setState(s: SyncState) {
  state = s;
  for (const fn of stateListeners) fn(state, lastSync);
}

export async function session(): Promise<Session | null> {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session;
}

let syncing = false;
let queued = false;

export async function syncNow(): Promise<void> {
  if (!supabase) return;
  const sess = await session();
  if (!sess) { setState("signed-out"); return; }
  if (syncing) { queued = true; return; }
  syncing = true;
  setState("syncing");
  try {
    const uid = sess.user.id;
    const d = await db();

    // PUSH — drain outbox
    const outbox = (await d.getAll("_outbox")) as { key: string; entity: EntityName; id: string }[];
    for (const item of outbox) {
      const record = (await d.get(ENTITIES[item.entity], item.id)) as Syncable | undefined;
      if (!record) { await d.delete("_outbox", item.key); continue; }
      const { error } = await supabase.from("records").upsert({
        user_id: uid,
        entity: ENTITIES[item.entity],
        id: record.id,
        data: record,
        updated_at: record.updatedAt,
        deleted: !!record.deleted,
      });
      if (error) throw error;
      await d.delete("_outbox", item.key);
    }

    // PULL — rows newer than high-water mark
    const since = (await getMeta<string>("syncSince")) ?? "1970-01-01T00:00:00Z";
    const { data, error } = await supabase
      .from("records")
      .select("entity,id,data,updated_at")
      .gt("updated_at", since)
      .order("updated_at", { ascending: true })
      .limit(1000);
    if (error) throw error;
    let newest = since;
    for (const row of data ?? []) {
      const entity = (Object.keys(ENTITIES) as EntityName[]).find(
        (k) => ENTITIES[k] === row.entity
      );
      if (!entity) continue;
      const incoming = row.data as Syncable;
      const local = (await d.get(ENTITIES[entity], incoming.id)) as Syncable | undefined;
      if (!local || (incoming.updatedAt ?? "") > (local.updatedAt ?? "")) {
        await put(entity, incoming, { fromSync: true });
      }
      if (row.updated_at > newest) newest = row.updated_at;
    }
    await setMeta("syncSince", newest);

    lastSync = new Date();
    setState("idle");
  } catch {
    setState(navigator.onLine ? "error" : "offline");
  } finally {
    syncing = false;
    if (queued) { queued = false; void syncNow(); }
  }
}

let started = false;

/** Start background sync: after local writes (debounced), on interval, on reconnect. */
export function startSync(): void {
  if (started || !supabase) return;
  started = true;
  let t: ReturnType<typeof setTimeout> | undefined;
  subscribe(() => {
    clearTimeout(t);
    t = setTimeout(() => void syncNow(), 1500);
  });
  window.addEventListener("online", () => void syncNow());
  setInterval(() => void syncNow(), 60_000);
  supabase.auth.onAuthStateChange(() => void syncNow());
  void syncNow();
}
