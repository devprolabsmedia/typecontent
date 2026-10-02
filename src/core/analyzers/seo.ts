import { markdownToPlainText, parseMarkdown, type MarkdownBlock } from "@/lib/markdown/markdown";
import type {
  ContentStats,
  ContentTypeDefinition,
  Metadata,
  SEOData,
  SEOResult,
} from "@/types/typecontent";

import { runRules } from "./seo-rules";

/**
 * Deterministic SEO analyzer. No AI, no network, no React.
 * Pure function of (content, content type) -> SEOResult.
 */

export interface SEOInput {
  contentType: ContentTypeDefinition;
  content: { title: string; markdown: string };
  seo?: SEOData;
  metadata?: Metadata;
  /** Pre-parsed canonical document, shared with the Writing analyzer. */
  document?: MarkdownBlock[];
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;
const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

export function computeStats(markdown: string, document?: MarkdownBlock[]): ContentStats {
  const blocks = document ?? parseMarkdown(markdown);
  const plain = markdownToPlainText(markdown);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

  let internalLinks = 0;
  let externalLinks = 0;
  const withoutImages = markdown.replace(IMAGE_RE, " ");
  for (const match of withoutImages.matchAll(LINK_RE)) {
    const href = match[1] ?? "";
    if (/^https?:\/\//i.test(href)) externalLinks += 1;
    else if (href.startsWith("#")) continue;
    else internalLinks += 1;
  }

  let images = 0;
  let imagesMissingAlt = 0;
  for (const match of markdown.matchAll(IMAGE_RE)) {
    images += 1;
    if (!(match[1] ?? "").trim()) imagesMissingAlt += 1;
  }

  return {
    words,
    characters: plain.length,
    readingMinutes: Math.max(1, Math.round(words / 220)),
    headings: blocks
      .filter((b): b is { kind: "heading"; level: number; text: string } => b.kind === "heading")
      .map((b) => ({ level: b.level, text: b.text })),
    internalLinks,
    externalLinks,
    images,
    imagesMissingAlt,
    codeBlocks: blocks.filter((b) => b.kind === "code").length,
  };
}

/** One analyzer; the content type decides which rules run. */
export function analyzeSEO(input: SEOInput): SEOResult {
  const stats = computeStats(input.content.markdown ?? "", input.document);
  const checks = runRules(input.contentType.seo.rules, {
    type: input.contentType,
    title: (input.seo?.title?.trim() || input.content.title || "").trim(),
    markdown: input.content.markdown ?? "",
    plain: markdownToPlainText(input.content.markdown ?? ""),
    seo: input.seo ?? {},
    metadata: input.metadata ?? {},
    stats,
  });
  const categories = [...new Set(checks.map((c) => c.category))];
  return { score: scoreChecks(checks), checks, categories, stats };
}

/** pass = full weight, warning = half, error = zero, info = excluded. */
export function scoreChecks(checks: SEOResult["checks"]): number {
  const scored = checks.filter((c) => c.status !== "info");
  const total = scored.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0) return 0;
  const earned = scored.reduce(
    (sum, c) => sum + c.weight * (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0),
    0,
  );
  return Math.round((earned / total) * 100);
}
