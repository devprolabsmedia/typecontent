import { describe, expect, it } from "vitest";

import { parseMarkdown, renderMarkdown, serializeMarkdown } from "./markdown";

describe("parseMarkdown", () => {
  it("parses headings, paragraphs, lists, quotes, code, images and dividers", () => {
    const blocks = parseMarkdown(
      [
        "## Hello",
        "",
        "Some **bold** text.",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
        "",
        "> a quote",
        "",
        "```ts",
        "const x = 1;",
        "```",
        "",
        "![alt](https://example.com/a.png)",
        "",
        "---",
      ].join("\n"),
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      "heading",
      "paragraph",
      "list",
      "list",
      "quote",
      "code",
      "image",
      "hr",
    ]);
  });

  it("parses callout blocks with variants", () => {
    const blocks = parseMarkdown(":::callout warning\nWatch out.\n:::");
    expect(blocks[0]).toEqual({ kind: "callout", variant: "warning", text: "Watch out." });
  });

  it("escapes raw HTML in output", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).not.toContain("<script>");
  });
});

describe("serializeMarkdown", () => {
  it("round-trips a document through parse -> serialize -> parse", () => {
    const source = [
      "## Title",
      "",
      "A paragraph with [a link](/docs).",
      "",
      "- item",
      "",
      ":::callout info",
      "Note this.",
      ":::",
    ].join("\n");
    const once = serializeMarkdown(parseMarkdown(source));
    const twice = serializeMarkdown(parseMarkdown(once));
    expect(twice).toBe(once);
    expect(once).toContain(":::callout info");
  });
});
