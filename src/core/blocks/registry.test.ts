import { describe, expect, it } from "vitest";

import { getBlock, listBlocks, registerBlock } from "./registry";

describe("block registry", () => {
  it("ships built-in blocks", () => {
    const types = listBlocks().map((b) => b.type);
    for (const t of ["paragraph", "heading-1", "bullet-list", "quote", "code-block", "divider"]) {
      expect(types).toContain(t);
    }
  });

  it("includes the callout example custom block", () => {
    expect(getBlock("callout")?.template).toContain(":::callout");
  });

  it("lets developers register custom blocks without core changes", () => {
    registerBlock({ type: "embed", name: "Embed", keywords: ["video"], template: "::embed::" });
    expect(getBlock("embed")?.name).toBe("Embed");
  });
});
