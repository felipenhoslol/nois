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
  deleteRemoteItem,
  fetchRemote,
  mergeItems,
  saveRemoteSettings,
  upsertItems,
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
        void upserter.current?.flushNow().catch(cloudError);
        upserter.current = null;
        syncedItems.current = null;
        syncedSettings.current = null;
        setSession(null);
        return;
      }

      const userId = user.id;
      upserter.current = createDebouncedUpserter((batch) => upsertItems(userId, batch));
      // Defer: supabase-js warns against awaiting its calls inside this callback.
      setTimeout(async () => {
        try {
          const remote = await fetchRemote();
          const { merged, toUpload } = mergeItems(itemsRef.current, remote.items);
          syncedItems.current = byId(merged);
          setItems(merged);
          await upsertItems(userId, toUpload);

          if (remote.settings) {
            const next = { ...DEFAULT_SETTINGS, ...remote.settings };
            syncedSettings.current = next;
            setSettings(next);
          } else {
            syncedSettings.current = settingsRef.current;
            await saveRemoteSettings(userId, settingsRef.current);
          }
          setSession({ id: userId, email: user.email ?? "" });
        } catch (e) {
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
    if (!session || !prev || !upserter.current) return;
    const next = byId(items);
    for (const item of items) if (prev.get(item.id) !== item) upserter.current.push(item);
    for (const id of prev.keys()) if (!next.has(id)) deleteRemoteItem(id).catch(cloudError);
    syncedItems.current = next;
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
