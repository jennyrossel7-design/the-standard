/** Local-first store.
 *  Every read and write happens against IndexedDB first — the app works fully
 *  offline. A background sync engine (lib/sync.ts) reconciles with Supabase
 *  using last-write-wins on updatedAt, per record. Deletes are tombstones so
 *  they propagate across devices.
 */
import { openDB, type IDBPDatabase } from "idb";
import type { EntityName, Syncable } from "../types";
import { ENTITIES, SCHEMA_VERSION } from "../types";

const DB_NAME = "the-standard";
const META = "_meta";

let dbPromise: Promise<IDBPDatabase> | null = null;

export function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, SCHEMA_VERSION, {
      upgrade(d) {
        for (const name of Object.values(ENTITIES)) {
          if (!d.objectStoreNames.contains(name)) {
            d.createObjectStore(name, { keyPath: "id" });
          }
        }
        if (!d.objectStoreNames.contains(META)) d.createObjectStore(META);
        if (!d.objectStoreNames.contains("_images")) d.createObjectStore("_images");
        if (!d.objectStoreNames.contains("_outbox")) {
          d.createObjectStore("_outbox", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Subscribe to any store change; returns unsubscribe. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

export async function all<T extends Syncable>(entity: EntityName): Promise<T[]> {
  const rows = (await (await db()).getAll(ENTITIES[entity])) as T[];
  return rows.filter((r) => !r.deleted);
}

export async function get<T extends Syncable>(
  entity: EntityName,
  id: string
): Promise<T | undefined> {
  const row = (await (await db()).get(ENTITIES[entity], id)) as T | undefined;
  return row && !row.deleted ? row : undefined;
}

/** Upsert a record locally and queue it for sync. */
export async function put<T extends Syncable>(
  entity: EntityName,
  record: T,
  opts: { fromSync?: boolean } = {}
): Promise<T> {
  const stamped = opts.fromSync
    ? record
    : { ...record, updatedAt: new Date().toISOString() };
  const d = await db();
  const tx = d.transaction([ENTITIES[entity], "_outbox"], "readwrite");
  await tx.objectStore(ENTITIES[entity]).put(stamped);
  if (!opts.fromSync) {
    await tx.objectStore("_outbox").put({
      key: `${entity}/${stamped.id}`,
      entity,
      id: stamped.id,
    });
  }
  await tx.done;
  notify();
  return stamped;
}

/** Soft delete — tombstoned so the deletion syncs to other devices. */
export async function remove(entity: EntityName, id: string): Promise<void> {
  const d = await db();
  const existing = (await d.get(ENTITIES[entity], id)) as Syncable | undefined;
  if (!existing) return;
  await put(entity, { ...existing, deleted: true });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db()).get(META, key) as Promise<T | undefined>;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put(META, value, key);
}

/** Local image cache: vision-board bytes, keyed by storage path. */
export async function putImage(path: string, blob: Blob): Promise<void> {
  await (await db()).put("_images", blob, path);
}

export async function getImage(path: string): Promise<Blob | undefined> {
  return (await db()).get("_images", path) as Promise<Blob | undefined>;
}

export function newId(): string {
  return crypto.randomUUID();
}

/** Export everything as a JSON document (privacy §11: user owns her data). */
export async function exportAll(): Promise<string> {
  const out: Record<string, unknown> = { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString() };
  for (const [key, name] of Object.entries(ENTITIES)) {
    out[key] = await (await db()).getAll(name);
  }
  return JSON.stringify(out, null, 2);
}

/** Import from a prototype or app export. Merges by id, newest updatedAt wins. */
export async function importAll(json: string): Promise<{ imported: number }> {
  const parsed = JSON.parse(json) as Record<string, unknown>;
  let imported = 0;
  for (const key of Object.keys(ENTITIES) as EntityName[]) {
    const rows = parsed[key];
    if (!Array.isArray(rows)) continue;
    for (const row of rows as Syncable[]) {
      if (!row || typeof row.id !== "string") continue;
      const existing = (await (await db()).get(ENTITIES[key], row.id)) as Syncable | undefined;
      if (!existing || (row.updatedAt ?? "") > (existing.updatedAt ?? "")) {
        await put(key, { ...row, updatedAt: row.updatedAt ?? new Date().toISOString() });
        imported++;
      }
    }
  }
  return { imported };
}
