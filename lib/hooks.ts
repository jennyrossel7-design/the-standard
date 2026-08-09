import { useCallback, useEffect, useState } from "react";
import { all, subscribe, get } from "./store";
import type { EntityName, Syncable } from "../types";

/** Live collection from the local store; re-reads on any write or sync. */
export function useCollection<T extends Syncable>(entity: EntityName): T[] {
  const [rows, setRows] = useState<T[]>([]);
  const read = useCallback(() => { void all<T>(entity).then(setRows); }, [entity]);
  useEffect(() => { read(); return subscribe(read); }, [read]);
  return rows;
}

export function useRecord<T extends Syncable>(entity: EntityName, id?: string): T | undefined {
  const [row, setRow] = useState<T | undefined>();
  const read = useCallback(() => {
    if (!id) { setRow(undefined); return; }
    void get<T>(entity, id).then(setRow);
  }, [entity, id]);
  useEffect(() => { read(); return subscribe(read); }, [read]);
  return row;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning. Nothing needs to be forced today.";
  if (h < 17) return "Good afternoon. You are allowed to slow down.";
  return "Good evening. The day can end gently.";
}

export function longDate(d = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
