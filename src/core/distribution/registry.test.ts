import { describe, expect, it } from "vitest";

import {
  defineContentType,
  getContentType,
  listContentTypes,
  registerContentType,
} from "@/core/content-types/registry";
import { parseMarkdown } from "@/lib/markdown/markdown";

import {
  collectDependencies,
  collectFiles,
  detectProject,
  generateConfig,
  parseCliArgs,
  planCopy,
  resolveComponents,
} from "./registry";

describe("component registry", () => {
  it("resolves dependencies first without duplicates", () => {
    const ids = resolveComponents(["editor"]).map((e) => e.id);
    expect(ids.at(-1)).toBe("editor");
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.indexOf("core")).toBeLessThan(ids.indexOf("seo"));
  });

  it("selects only the files a component needs", () => {
    const files = collectFiles(["seo"]);
    expect(files).toContain("src/core/analyzers/seo.ts");
    expect(files.some((f) => f.includes("ContentEditor"))).toBe(false);
    expect(collectDependencies(["markdown"])).toEqual([]);
  });
});

describe("cli", () => {
  it("parses commands", () => {
    expect(parseCliArgs(["init"])).toEqual({ kind: "init", force: false });
    expect(parseCliArgs(["add", "editor", "seo", "--force"])).toEqual({
      kind: "add",
      components: ["editor", "seo"],
      force: true,
    });
    expect(parseCliArgs(["add", "nope"]).kind).toBe("error");
    expect(parseCliArgs([]).kind).toBe("help");
  });

  it("generates config", () => {
    expect(generateConfig()).toContain('componentsDir: "./src/components/typecontent"');
  });

  it("never overwrites without --force", () => {
    const existing = new Set(["a.ts"]);
    expect(planCopy(["a.ts", "b.ts"], existing, false)).toEqual({ write: ["b.ts"], skip: ["a.ts"] });
    expect(planCopy(["a.ts"], existing, true).write).toEqual(["a.ts"]);
  });

  it("detects project basics", () => {
    const info = detectProject({ dependencies: { react: "19", next: "15" } }, ["pnpm-lock.yaml"]);
    expect(info).toMatchObject({ packageManager: "pnpm", react: true, framework: "next" });
  });
});

describe("custom content types", () => {
  it("defines and registers a case study", () => {
    const caseStudy = defineContentType({
      id: "case-study",
      name: "Case Study",
      features: { seo: true, author: true },
    });
    registerContentType(caseStudy);
    expect(getContentType("case-study").seo.enabled).toBe(true);
    expect(listContentTypes().map((t) => t.id)).toContain("case-study");
  });

  it("markdown integration: bodies start at H2", () => {
    const blocks = parseMarkdown("## Intro\n\nHello");
    expect(blocks[0]).toMatchObject({ kind: "heading" });
  });
});
