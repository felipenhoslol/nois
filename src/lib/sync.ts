import { z } from "zod";
import type { Item } from "./items";
import type { Settings } from "./settings";
import { supabase } from "./supabase";

const byNewest = (x: Item, y: Item) => y.createdAt.localeCompare(x.createdAt);

/** What this device knows about the cloud, per signed-in user. Survives reloads. */
export type SyncState = {
  userId: string | null;
  synced: string[]; // ids known to exist in the cloud
  dirty: string[]; // ids edited here and not yet confirmed by the cloud
  deleted: string[]; // ids deleted here and not yet confirmed by the cloud
};
export const SYNC_KEY = "archive.sync.v1";
const EMPTY_SYNC: SyncState = { userId: null, synced: [], dirty: [], deleted: [] };

export function loadSyncState(): SyncState {
  try {
    return {
      ...EMPTY_SYNC,
      ...(JSON.parse(localStorage.getItem(SYNC_KEY) ?? "{}") as Partial<SyncState>),
    };
  } catch {
    return { ...EMPTY_SYNC };
  }
}

export function saveSyncState(s: SyncState): void {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(s));
  } catch (err) {
    console.warn("Could not save sync state", err);
  }
}

/**
 * Joins local and cloud items by id.
 * - Edited here but not confirmed (dirty): local wins and is uploaded again.
 * - Deleted here but not confirmed: stays deleted and the delete is retried.
 * - Known to the cloud before but gone now: it was deleted on another device, so drop it.
 * - Never synced: uploaded, except example items (`seed-*`) when the cloud already has data.
 * - Otherwise the cloud version wins.
 */
export function mergeItems(
  local: Item[],
  remote: Item[],
  state: Pick<SyncState, "synced" | "dirty" | "deleted"> = EMPTY_SYNC,
): { merged: Item[]; toUpload: Item[]; toDelete: string[] } {
  const synced = new Set(state.synced);
  const dirty = new Set(state.dirty);
  const deleted = new Set(state.deleted);
  const remoteById = new Map(remote.map((i) => [i.id, i]));
  const merged = new Map<string, Item>();
  const toUpload: Item[] = [];

  for (const r of remote) if (!deleted.has(r.id)) merged.set(r.id, r);
  for (const l of local) {
    if (deleted.has(l.id)) continue;
    if (dirty.has(l.id)) {
      merged.set(l.id, l);
      toUpload.push(l);
    } else if (remoteById.has(l.id) || synced.has(l.id)) {
      continue;
    } else if (!(remote.length > 0 && l.id.startsWith("seed-"))) {
      merged.set(l.id, l);
      toUpload.push(l);
    }
  }
  return {
    merged: [...merged.values()].sort(byNewest),
    toUpload,
    toDelete: [...deleted],
  };
}

const backupSchema = z.object({
  items: z.array(
    z
      .object({
        id: z.string().min(1),
        category: z.string(),
        title: z.string(),
        createdAt: z.string(),
        tags: z.array(z.string()).default([]),
        favorite: z.boolean().default(false),
      })
      .passthrough(),
  ),
  settings: z.record(z.unknown()).optional(),
});

// Validates a backup file before it replaces anything. Throws on a bad shape.
export function parseBackup(json: unknown): { items: Item[]; settings?: Partial<Settings> } {
  const parsed = backupSchema.parse(json);
  const out: { items: Item[]; settings?: Partial<Settings> } = { items: parsed.items as Item[] };
  if (parsed.settings) out.settings = parsed.settings as Partial<Settings>;
  return out;
}

// Collects item writes and sends only the latest version of each, once things go quiet.
// A failed send stays queued; drop() forgets an item that was deleted meanwhile.
export function createDebouncedUpserter(flush: (items: Item[]) => Promise<void>, ms = 800) {
  const pending = new Map<string, Item>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flushNow = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (pending.size === 0) return;
    const batch = [...pending.values()];
    await flush(batch);
    for (const i of batch) if (pending.get(i.id) === i) pending.delete(i.id);
  };

  return {
    push(item: Item) {
      pending.set(item.id, item);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flushNow().catch(() => {}), ms);
    },
    drop(id: string) {
      pending.delete(id);
    },
    isPending: (id: string) => pending.has(id),
    flushNow,
  };
}

/**
 * Uploads a photo/audio to the `media` bucket under the user's folder and returns its public URL.
 * Returns null when sync isn't configured or nobody is signed in (caller keeps the data URL).
 */
export async function uploadMedia(file: Blob, ext: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, file.type ? { contentType: file.type } : {});
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// --- Cloud calls. Only used with a signed-in session; RLS limits every query to that user. ---

export async function fetchRemote(): Promise<{ items: Item[]; settings: Settings | null }> {
  const [items, settings] = await Promise.all([
    supabase!.from("items").select("data"),
    supabase!.from("settings").select("data").maybeSingle(),
  ]);
  if (items.error) throw items.error;
  if (settings.error) throw settings.error;
  return {
    items: (items.data ?? []).map((r) => r.data as Item),
    settings: (settings.data?.data as Settings | undefined) ?? null,
  };
}

export async function upsertItems(userId: string, items: Item[]): Promise<void> {
  if (items.length === 0) return;
  const now = new Date().toISOString();
  const { error } = await supabase!
    .from("items")
    .upsert(items.map((i) => ({ user_id: userId, id: i.id, data: i, updated_at: now })));
  if (error) throw error;
}

export async function deleteRemoteItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase!.from("items").delete().in("id", ids);
  if (error) throw error;
}

export async function saveRemoteSettings(userId: string, s: Settings): Promise<void> {
  const { error } = await supabase!
    .from("settings")
    .upsert({ user_id: userId, data: s, updated_at: new Date().toISOString() });
  if (error) throw error;
}
