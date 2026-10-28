// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { MusicPicker } from "./music-picker";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("Enter in the search field is prevented so the surrounding form does not submit", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () =>
    createRoot(host).render(
      <form>
        <MusicPicker onPick={vi.fn()} />
      </form>,
    ),
  );
  const input = host.querySelector("input")!;
  const ev = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  input.dispatchEvent(ev);
  expect(ev.defaultPrevented).toBe(true);
});
