import { expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({ supabase: null }));

it("uploadMedia returns null when sync is not configured", async () => {
  const { uploadMedia } = await import("./sync");
  expect(await uploadMedia(new Blob(["x"]), "jpg")).toBeNull();
});
