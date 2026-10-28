import { expect, it } from "vitest";
import { rpmToRate } from "./youtube";

it("rpmToRate", () => {
  expect(rpmToRate(33)).toBe(1);
  expect(rpmToRate(45)).toBe(1.25);
});
