import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  loadItems,
  loadSettings,
  saveItems,
  saveSettings,
  seedItems,
  uid,
  type Item,
  type Settings,
} from "./archive";

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
    const stored = localStorage.getItem("archive.items.v1");
    setItems(stored ? loadItems() : seedItems());
    setSettings(loadSettings());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveItems(items);
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    saveSettings(settings);

    document.documentElement.dataset["anim"] = String(settings.animations);

    if (settings.useCustomTheme && settings.customTheme) {
      const ct = settings.customTheme;
      document.documentElement.dataset["theme"] = "custom";
      if (ct.primary) document.documentElement.style.setProperty("--primary", ct.primary);
      if (ct.secondary) document.documentElement.style.setProperty("--secondary", ct.secondary);
      if (ct.background) document.documentElement.style.setProperty("--background", ct.background);
      if (ct.surface) {
        document.documentElement.style.setProperty("--card", ct.surface);
        document.documentElement.style.setProperty("--paper", ct.surface);
      }
      if (ct.textColor) document.documentElement.style.setProperty("--foreground", ct.textColor);
      if (ct.font) document.documentElement.dataset["font"] = ct.font;
      if (ct.borderStyle) document.documentElement.dataset["borderStyle"] = ct.borderStyle;
      if (ct.wallpaper) {
        document.documentElement.dataset["wallpaper"] = ct.wallpaper;
        if (ct.wallpaper === "custom" && ct.customWallpaperUrl) {
          document.documentElement.style.setProperty(
            "--custom-wallpaper-url",
            `url('${ct.customWallpaperUrl}')`,
          );
        } else {
          document.documentElement.style.removeProperty("--custom-wallpaper-url");
        }
      }
    } else {
      document.documentElement.dataset["theme"] = settings.theme;
      document.documentElement.dataset["wallpaper"] = settings.wallpaper ?? "clean";
      document.documentElement.removeAttribute("data-font");
      document.documentElement.removeAttribute("data-border-style");
      document.documentElement.style.removeProperty("--custom-wallpaper-url");

      if (settings.hue != null) {
        document.documentElement.style.setProperty(
          "--primary",
          `oklch(0.55 0.14 ${settings.hue})`,
        );
      } else {
        document.documentElement.style.removeProperty("--primary");
      }
      document.documentElement.style.removeProperty("--secondary");
      document.documentElement.style.removeProperty("--background");
      document.documentElement.style.removeProperty("--card");
      document.documentElement.style.removeProperty("--paper");
      document.documentElement.style.removeProperty("--foreground");
    }
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
