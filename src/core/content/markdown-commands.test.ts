import { describe, expect, it } from "vitest";

import { applyMarkdownCommand } from "./markdown-commands";

const sel = (value: string, start = 0, end = value.length) => ({ value, start, end });

describe("applyMarkdownCommand", () => {
  it("wraps and unwraps bold", () => {
    const wrapped = applyMarkdownCommand("bold", sel("hello"));
    expect(wrapped.value).toBe("**hello**");
    const unwrapped = applyMarkdownCommand("bold", sel("**hello**", 2, 7));
    expect(unwrapped.value).toBe("hello");
  });

  it("prefixes lines for headings and lists", () => {
    expect(applyMarkdownCommand("h2", sel("Title")).value).toBe("## Title");
    expect(applyMarkdownCommand("bullet", sel("a\nb")).value).toBe("- a\n- b");
    expect(applyMarkdownCommand("ordered", sel("a\nb")).value).toBe("1. a\n2. b");
  });

  it("inserts links, images, code blocks and dividers", () => {
    expect(applyMarkdownCommand("link", sel("site")).value).toBe("[site](https://)");
    expect(applyMarkdownCommand("image", sel("")).value).toContain("![Descriptive alt text]");
    expect(applyMarkdownCommand("codeblock", sel("")).value).toContain("```ts");
    expect(applyMarkdownCommand("divider", sel("text")).value).toContain("---");
  });

  it("underline wraps with <u> tags", () => {
    expect(applyMarkdownCommand("underline", sel("word")).value).toBe("<u>word</u>");
  });
});
