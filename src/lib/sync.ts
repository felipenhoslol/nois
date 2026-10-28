import { z } from "zod";
import type { Item } from "./items";
import type { Settings } from "./settings";
import { supabase } from "./supabase";

const byNewest = (x: Item, y: Item) => y.createdAt.localeCompare(x.createdAt);

/**
 * Joins local and cloud items by id. Cloud wins on conflict; local-only items get uploaded.
 * Example items (`seed-*`) are dropped when the cloud already has data, so a second device
 * doesn't duplicate them.
 */
export function mergeItems(local: Item[], remote: Item[]): { merged: Item[]; toUpload: Item[] } {
  const remoteIds = new Set(remote.map((i) => i.id));
  const toUpload = local.filter(
    (i) => !remoteIds.has(i.id) && !(remote.length > 0 && i.id.startsWith("seed-")),
  );
  return { merged: [...remote, ...toUpload].sort(byNewest), toUpload };
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
export function createDebouncedUpserter(flush: (items: Item[]) => Promise<void>, ms = 800) {
  const pending = new Map<string, Item>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flushNow = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (pending.size === 0) return;
    const batch = [...pending.values()];
    pending.clear();
    await flush(batch);
  };

  return {
    push(item: Item) {
      pending.set(item.id, item);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flushNow().catch(() => {}), ms);
    },
    flushNow,
  };
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

export async function deleteRemoteItem(id: string): Promise<void> {
  const { error } = await supabase!.from("items").delete().eq("id", id);
  if (error) throw error;
}

export async function saveRemoteSettings(userId: string, s: Settings): Promise<void> {
  const { error } = await supabase!
    .from("settings")
    .upsert({ user_id: userId, data: s, updated_at: new Date().toISOString() });
  if (error) throw error;
}
