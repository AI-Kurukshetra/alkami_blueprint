import { describe, expect, it } from "vitest";
import { formatCurrency, maskAccount } from "../packages/utils/src/index";

describe("utility helpers", () => {
  it("formats USD currency", () => {
    expect(formatCurrency(1250.5)).toBe("$1,250.50");
  });

  it("masks account numbers", () => {
    expect(maskAccount("1234567890")).toBe("••••7890");
  });
});

