import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/lib/supabase", () => ({
  get supabase() {
    return supabaseMock.value;
  },
}));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ user: null, ready: false }) }));

afterEach(() => vi.resetModules());

// The server never has a Supabase client; the first browser render must match it.
it("renders the same markup before ready whether or not supabase exists", async () => {
  const { SyncSection } = await import("./sync-section");
  supabaseMock.value = null;
  const server = renderToString(<SyncSection />);
  supabaseMock.value = { auth: {} };
  const client = renderToString(<SyncSection />);
  expect(client).toBe(server);
});
