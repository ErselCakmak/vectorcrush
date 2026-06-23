import { describe, expect, it } from "vitest";
import { optimizeSvg } from "@vectorcrush/core";

describe("cli package smoke", () => {
  it("can import core", () => {
    expect(optimizeSvg("<svg><!--x--></svg>").svg).toBe("<svg></svg>");
  });
});
