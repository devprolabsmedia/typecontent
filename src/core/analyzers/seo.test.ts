import { describe, expect, it } from "vitest";

import { getContentType } from "@/core/content-types/registry";

import { analyzeSEO, computeStats } from "./seo";

const blog = getContentType("blog");
const course = getContentType("course");
const run = (title: string, markdown: string, type = blog, extra = {}) =>
  analyzeSEO({ contentType: type, content: { title, markdown }, ...extra });

describe("analyzeSEO", () => {
  it("errors when the title is missing", () => {
    expect(run("", "## Body").checks.find((c) => c.id === "title")?.status).toBe("error");
  });
  it("passes heading structure when the body starts at H2", () => {
    const r = run("My Post", "## Section\n\nText.");
    expect(r.checks.find((c) => c.id === "headingStructure")?.status).toBe("pass");
  });
  it("warns when the body contains its own H1", () => {
    const r = run("My Post", "# Duplicate\n\nText.");
    expect(r.checks.find((c) => c.id === "headingStructure")?.status).toBe("warning");
  });
  it("is deterministic and reacts to SEO data", () => {
    const a = run("My Post", "## A\n\nText.");
    expect(run("My Post", "## A\n\nText.").score).toBe(a.score);
    const b = run("My Post", "## A\n\nText.", blog, { seo: { description: "A summary." } });
    expect(b.score).not.toBe(a.score);
  });
  it("flags a course without lessons", () => {
    const r = run("Course", "Intro.", course, { metadata: {} });
    expect(r.checks.find((c) => c.id === "lessonCount")?.status).toBe("error");
  });
  it("handles empty content", () => {
    expect(() => run("", "")).not.toThrow();
  });
  it("computes stats from the document", () => {
    const stats = computeStats("## A\n\nWords here.\n\n![x](https://a.com/i.png)\n\n[b](/in)");
    expect(stats.headings).toEqual([{ level: 2, text: "A" }]);
    expect(stats.images).toBe(1);
    expect(stats.internalLinks).toBe(1);
  });
});
