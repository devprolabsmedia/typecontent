import { describe, expect, it } from "vitest";

import { parseVideoUrl } from "@/core/content/video";

import { analyzeWritingIssues, applyWritingIssue, writingIssueScores } from "./writing-issues";

describe("writing issues", () => {
  it("detects typos and applies a fix", () => {
    const md = "This is usefull text.";
    const issues = analyzeWritingIssues(md);
    const typo = issues.find((i) => i.original === "usefull");
    expect(typo).toBeDefined();
    expect(applyWritingIssue(md, typo!, typo!.suggestions[0]!)).toBe("This is useful text.");
  });

  it("returns null when the range no longer matches", () => {
    const md = "This is usefull text.";
    const typo = analyzeWritingIssues(md).find((i) => i.original === "usefull")!;
    expect(applyWritingIssue("Changed entirely.", typo, "useful")).toBeNull();
  });

  it("ignores code and is deterministic", () => {
    const md = "Use `teh` here.\n\n```\nusefull\n```";
    expect(analyzeWritingIssues(md)).toEqual([]);
    const a = analyzeWritingIssues("We did this in order to win.");
    expect(analyzeWritingIssues("We did this in order to win.")).toEqual(a);
  });

  it("scores clean text at 100", () => {
    expect(writingIssueScores([])).toEqual({ correctness: 100, clarity: 100, style: 100 });
  });
});

describe("parseVideoUrl", () => {
  it("parses YouTube formats", () => {
    for (const u of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ]) {
      expect(parseVideoUrl(u)?.videoId).toBe("dQw4w9WgXcQ");
    }
  });
  it("rejects other URLs", () => {
    expect(parseVideoUrl("https://example.com/video")).toBeNull();
    expect(parseVideoUrl("not a url")).toBeNull();
  });
});
