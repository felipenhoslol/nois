// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, expect, it, vi } from "vitest";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOtp: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ supabase: { auth } }));
vi.mock("@/lib/archive-context", () => ({ useArchive: () => ({ user: null, ready: true }) }));
const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

beforeEach(() => {
  Object.values(auth).forEach((f) => f.mockReset());
  toastError.mockReset();
});

async function fillAndSubmit(email: string, password: string) {
  const { SyncSection } = await import("./sync-section");
  const el = document.createElement("div");
  document.body.appendChild(el);
  await act(async () => createRoot(el).render(<SyncSection />));
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  for (const [sel, value] of [
    ["input[type=email]", email],
    ["input[type=password]", password],
  ] as const) {
    const input = el.querySelector(sel) as HTMLInputElement;
    await act(async () => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  await act(async () => {
    el.querySelector("form")!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  return el;
}

it("signs in with e-mail and password, never signs up or sends a link", async () => {
  auth.signInWithPassword.mockResolvedValue({ error: null });
  await fillAndSubmit(" a@b.c ", "segredo123");
  expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.c", password: "segredo123" });
  expect(auth.signUp).not.toHaveBeenCalled();
  expect(auth.signInWithOtp).not.toHaveBeenCalled();
});

it("a wrong password shows one plain message and keeps the e-mail typed", async () => {
  auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
  const el = await fillAndSubmit("a@b.c", "errada");
  expect(toastError).toHaveBeenCalledWith("E-mail ou senha incorretos.");
  expect((el.querySelector("input[type=email]") as HTMLInputElement).value).toBe("a@b.c");
});
