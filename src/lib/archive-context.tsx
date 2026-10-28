import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { hasStoredItems, loadItems, saveItems, seedItems, uid, type Item } from "./items";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "./settings";
import { supabase } from "./supabase";
import {
  createDebouncedUpserter,
  deleteRemoteItems,
  fetchRemote,
  loadSyncState,
  mergeItems,
  saveRemoteSettings,
  saveSyncState,
  upsertItems,
  type SyncState,
} from "./sync";
import { applyTheme } from "./theme";

type Ctx = {
  items: Item[];
  settings: Settings;
  ready: boolean;
  user: { email: string } | null;
  addItem: (i: Omit<Item, "id" | "createdAt" | "favorite" | "tags"> & Partial<Item>) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceAll: (items: Item[], settings?: Partial<Settings>) => void;
  resetAll: () => void;
};

const ArchiveContext = createContext<Ctx | null>(null);

const cloudError = () => toast.error("não consegui salvar na nuvem, ficou guardado aqui ♡");
const byId = (list: Item[]) => new Map(list.map((i) => [i.id, i]));
const without = (list: string[], ids: Iterable<string>) => {
  const drop = new Set(ids);
  return list.filter((id) => !drop.has(id));
};
const withAll = (list: string[], ids: Iterable<string>) => [...new Set([...list, ...ids])];

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{ id: string; email: string } | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  // What the cloud has, as far as we know. null = not syncing (signed out or not configured).
  const syncedItems = useRef<Map<string, Item> | null>(null);
  const syncedSettings = useRef<Settings | null>(null);
  const upserter = useRef<ReturnType<typeof createDebouncedUpserter> | null>(null);
  // Persisted record of what the cloud has confirmed (see SyncState). null = not syncing.
  const syncState = useRef<SyncState | null>(null);
  const updateSyncState = (fn: (s: SyncState) => SyncState) => {
    if (!syncState.current) return;
    syncState.current = fn(syncState.current);
    saveSyncState(syncState.current);
  };

  useEffect(() => {
    setItems(hasStoredItems() ? loadItems() : seedItems());
    setSettings(loadSettings());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveItems(items);
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    saveSettings(settings);
    applyTheme(document.documentElement, settings);
  }, [settings, ready]);

  // Sign-in / sign-out. On sign-in, merge cloud and local once, then mirror changes.
  useEffect(() => {
    if (!ready || !supabase) return;
    const client = supabase;
    let currentUser: string | null = null;

    const { data } = client.auth.onAuthStateChange((_event, s) => {
      const user = s?.user ?? null;
      if ((user?.id ?? null) === currentUser) return;
      currentUser = user?.id ?? null;

      if (!user) {
        // Unsent edits stay marked dirty on this device and go up on the next sign-in.
        upserter.current = null;
        syncedItems.current = null;
        syncedSettings.current = null;
        syncState.current = null;
        setSession(null);
        return;
      }

      const userId = user.id;
      const stillSignedIn = () => currentUser === userId;
      let local = itemsRef.current;
      let st = loadSyncState();
      if (st.userId && st.userId !== userId) {
        // Another account used this device: don't hand its items to this one.
        local = [];
        st = { userId, synced: [], dirty: [], deleted: [] };
      }
      syncState.current = { ...st, userId };
      saveSyncState(syncState.current);

      upserter.current = createDebouncedUpserter(async (batch) => {
        await upsertItems(userId, batch).catch((e: unknown) => {
          cloudError();
          throw e;
        });
        // Clean only items that weren't edited again while the request was in flight.
        const current = byId(itemsRef.current);
        const done = batch.filter((i) => current.get(i.id) === i).map((i) => i.id);
        updateSyncState((x) => ({
          ...x,
          dirty: without(x.dirty, done),
          synced: withAll(x.synced, done),
        }));
      });

      // Defer: supabase-js warns against awaiting its calls inside this callback.
      setTimeout(async () => {
        try {
          const remote = await fetchRemote();
          if (!stillSignedIn()) return;
          const { merged, toUpload, toDelete } = mergeItems(local, remote.items, st);
          syncedItems.current = byId(merged);
          setItems(merged);
          await upsertItems(userId, toUpload);
          await deleteRemoteItems(toDelete);
          if (!stillSignedIn()) return;
          updateSyncState((x) => ({
            ...x,
            dirty: [],
            deleted: [],
            synced: merged.map((i) => i.id),
          }));

          if (remote.settings) {
            const next = { ...DEFAULT_SETTINGS, ...remote.settings };
            syncedSettings.current = next;
            setSettings(next);
          } else {
            syncedSettings.current = settingsRef.current;
            await saveRemoteSettings(userId, settingsRef.current);
          }
          if (stillSignedIn()) setSession({ id: userId, email: user.email ?? "" });
        } catch (e) {
          if (!stillSignedIn()) return;
          console.warn("Sync failed", e);
          syncedItems.current = null;
          toast.error("não consegui sincronizar agora, seus dados continuam aqui ♡");
        }
      }, 0);
    });

    const flush = () => void upserter.current?.flushNow().catch(() => {});
    window.addEventListener("beforeunload", flush);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("beforeunload", flush);
    };
  }, [ready]);

  // Mirror item changes: changed objects are upserted (debounced), missing ids are deleted.
  useEffect(() => {
    const prev = syncedItems.current;
    const u = upserter.current;
    if (!session || !prev || !u) return;
    const next = byId(items);
    const changed = items.filter((i) => prev.get(i.id) !== i);
    const removed = [...prev.keys()].filter((id) => !next.has(id));
    syncedItems.current = next;
    if (changed.length === 0 && removed.length === 0) return;

    // Mark first, so an edit or delete that never reaches the cloud survives a reload.
    updateSyncState((x) => ({
      ...x,
      dirty: without(
        withAll(
          x.dirty,
          changed.map((i) => i.id),
        ),
        removed,
      ),
      deleted: withAll(x.deleted, removed),
    }));
    changed.forEach((i) => u.push(i));
    removed.forEach((id) => u.drop(id));
    if (removed.length > 0) {
      deleteRemoteItems(removed)
        .then(() =>
          updateSyncState((x) => ({
            ...x,
            deleted: without(x.deleted, removed),
            synced: without(x.synced, removed),
          })),
        )
        .catch(cloudError);
    }
  }, [items, session]);

  // Mirror settings, debounced.
  useEffect(() => {
    if (!session || !syncedSettings.current || syncedSettings.current === settings) return;
    const t = setTimeout(() => {
      syncedSettings.current = settings;
      saveRemoteSettings(session.id, settings).catch(cloudError);
    }, 800);
    return () => clearTimeout(t);
  }, [settings, session]);

  const addItem: Ctx["addItem"] = useCallback((data) => {
    const item: Item = {
      tags: [],
      favorite: false,
      ...data,
      id: uid(),
      createdAt: new Date().toISOString(),
    } as Item;
    setItems((prev) => [item, ...prev]);
    return item;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      settings,
      ready,
      user: session ? { email: session.email } : null,
      addItem,
      updateItem: (id, patch) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      toggleFavorite: (id) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      replaceAll: (next, nextSettings) => {
        setItems(next);
        if (nextSettings) setSettings({ ...DEFAULT_SETTINGS, ...nextSettings });
      },
      resetAll: () => setItems([]),
    }),
    [items, settings, ready, session, addItem],
  );
  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchive() {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive must be used within an ArchiveProvider");
  return ctx;
}
