// @vitest-environment jsdom
import { act, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

// The "-" prefix keeps the TanStack Router generator from treating this file as a route.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const addItem = vi.hoisted(() => vi.fn(() => ({ id: "new" })));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: object) => ({
    ...opts,
    useParams: () => ({ category: "music" }),
  }),
  Link: ({ children }: { children: unknown }) => children,
  useNavigate: () => vi.fn(),
}));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ addItem }) }));
vi.mock("@/components/music-picker", () => ({
  MusicPicker: ({ onPick }: { onPick: (t: object) => void }) => (
    <button
      type="button"
      id="pick"
      onClick={() =>
        onPick({ title: "Song", artist: "A", artwork: "art.jpg", previewUrl: "prev.mp3" })
      }
    />
  ),
}));
vi.mock("@/components/media-picker", () => ({
  MediaPicker: (p: { onImageChange: (v: string) => void; onAudioChange?: (v: string) => void }) => (
    <button
      type="button"
      id="media"
      onClick={() => {
        p.onImageChange("mine.jpg");
        p.onAudioChange?.("mine.mp3");
      }}
    />
  ),
}));

it("cover and audio chosen in Mais detalhes win over the picked song's", async () => {
  const { Route } = await import("./new.$category");
  const NewItem = (Route as unknown as { component: ComponentType }).component;
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () => createRoot(host).render(<NewItem />));
  await act(async () => host.querySelector<HTMLButtonElement>("#media")!.click());
  await act(async () => host.querySelector<HTMLButtonElement>("#pick")!.click());
  expect(addItem).toHaveBeenCalledWith(
    expect.objectContaining({ image: "mine.jpg", audioUrl: "mine.mp3" }),
  );
});
