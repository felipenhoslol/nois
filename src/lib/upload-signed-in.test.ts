import { expect, it, vi } from "vitest";

const upload = vi.fn().mockResolvedValue({ error: null });
vi.mock("./supabase", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: { user: { id: "u1" } } } }) },
    storage: {
      from: () => ({
        upload,
        getPublicUrl: (p: string) => ({ data: { publicUrl: `https://cdn/${p}` } }),
      }),
    },
  },
}));

it("uploads into the user's own folder and returns the public URL", async () => {
  const { uploadMedia } = await import("./sync");
  const url = await uploadMedia(new Blob(["x"], { type: "image/jpeg" }), "jpg");
  expect(upload.mock.calls[0]![0]).toMatch(/^u1\/[0-9a-f-]+\.jpg$/);
  expect(upload.mock.calls[0]![2]).toEqual({ contentType: "image/jpeg" });
  expect(url).toMatch(/^https:\/\/cdn\/u1\//);
});
