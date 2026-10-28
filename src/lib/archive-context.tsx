import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hasStoredItems, loadItems, saveItems, seedItems, uid, type Item } from "./items";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from "./settings";
import { applyTheme } from "./theme";

type Ctx = {
  items: Item[];
  settings: Settings;
  ready: boolean;
  addItem: (i: Omit<Item, "id" | "createdAt" | "favorite" | "tags"> & Partial<Item>) => Item;
  updateItem: (id: string, patch: Partial<Item>) => void;
  removeItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const ArchiveContext = createContext<Ctx | null>(null);

export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

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
      addItem,
      updateItem: (id, patch) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))),
      removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      toggleFavorite: (id) =>
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
        ),
      updateSettings: (patch) => setSettings((prev) => ({ ...prev, ...patch })),
      resetAll: () => setItems([]),
    }),
    [items, settings, ready, addItem],
  );

  return <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>;
}

export function useArchive() {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive must be used within an ArchiveProvider");
  return ctx;
}
