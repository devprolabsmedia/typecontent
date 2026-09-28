import { describe, expect, it } from "vitest";

import { contentTypes, getContentType } from "./registry";

describe("content type registry", () => {
  it("provides the six built-in content types", () => {
    expect(contentTypes.map((t) => t.id)).toEqual([
      "blog",
      "page",
      "docs",
      "knowledge-base",
      "changelog",
      "course",
    ]);
  });

  it("each type declares metadata groups and an SEO policy", () => {
    for (const type of contentTypes) {
      expect(type.metadataGroups.length).toBeGreaterThan(0);
      expect(type.seo.titleRange[0]).toBeLessThan(type.seo.titleRange[1]);
    }
  });

  it("resolves types by id", () => {
    expect(getContentType("docs").name).toBe("Docs");
  });
});
