// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase", () => ({ supabase: { auth: { signInWithOtp } } }));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ user: null, ready: true }) }));

it("the e-mail link never creates new accounts (only the two existing users)", async () => {
  const { SyncSection } = await import("./sync-section");
  const el = document.createElement("div");
  document.body.appendChild(el);
  await act(async () => createRoot(el).render(<SyncSection />));
  const input = el.querySelector("input[type=email]") as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(input, "a@b.c");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    el.querySelector("form")!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: "a@b.c",
    options: expect.objectContaining({ shouldCreateUser: false }),
  });
});
