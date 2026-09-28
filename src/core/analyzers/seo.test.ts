import { describe, expect, it } from "vitest";

import { getContentType } from "@/core/content-types/registry";

import { analyzeSEO, computeStats } from "./seo";

const blog = getContentType("blog");

describe("analyzeSEO", () => {
  it("fails when the title is missing", () => {
    const result = analyzeSEO({ title: "", markdown: "## Body" }, blog);
    expect(result.checks.find((c) => c.id === "title-exists")?.status).toBe("fail");
  });

  it("passes H1 structure when the body starts at H2", () => {
    const result = analyzeSEO({ title: "My Post", markdown: "## Section\n\nText." }, blog);
    expect(result.checks.find((c) => c.id === "single-h1")?.status).toBe("pass");
  });

  it("warns when the body contains its own H1", () => {
    const result = analyzeSEO({ title: "My Post", markdown: "# Duplicate\n\nText." }, blog);
    expect(result.checks.find((c) => c.id === "single-h1")?.status).toBe("warning");
  });

  it("computes stats from the document", () => {
    const stats = computeStats("## A\n\nWords here.\n\n![x](https://a.com/i.png)\n\n[b](/in)");
    expect(stats.headings).toEqual([{ level: 2, text: "A" }]);
    expect(stats.images).toBe(1);
    expect(stats.internalLinks).toBe(1);
  });
});
