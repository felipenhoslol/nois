// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("is null without env vars (app stays local-only)", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
  const { supabase } = await import("./supabase");
  expect(supabase).toBeNull();
});

it("creates a client when env vars exist", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  const { supabase } = await import("./supabase");
  expect(supabase).not.toBeNull();
});
