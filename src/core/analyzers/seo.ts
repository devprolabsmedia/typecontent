import { markdownToPlainText, parseMarkdown } from "@/lib/markdown/markdown";
import type {
  ContentStats,
  ContentTypeDefinition,
  SEOCheck,
  SEOResult,
} from "@/types/typecontent";

/**
 * Deterministic SEO analyzer. No AI, no network, no React.
 * Pure function of (content, content type) -> SEOResult.
 */

export interface SEOInput {
  title: string;
  markdown: string;
  metaDescription?: string;
  focusKeyword?: string;
}

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;
const IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)\)/g;

export function computeStats(markdown: string): ContentStats {
  const blocks = parseMarkdown(markdown);
  const plain = markdownToPlainText(markdown);
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

  let internalLinks = 0;
  let externalLinks = 0;
  const withoutImages = markdown.replace(IMAGE_RE, " ");
  for (const match of withoutImages.matchAll(LINK_RE)) {
    const href = match[1];
    if (/^https?:\/\//i.test(href)) externalLinks += 1;
    else if (href.startsWith("#")) continue;
    else internalLinks += 1;
  }

  let images = 0;
  let imagesMissingAlt = 0;
  for (const match of markdown.matchAll(IMAGE_RE)) {
    images += 1;
    if (!match[1].trim()) imagesMissingAlt += 1;
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

export function analyzeSEO(input: SEOInput, type: ContentTypeDefinition): SEOResult {
  const stats = computeStats(input.markdown);
  const checks: SEOCheck[] = [];
  const title = input.title.trim();
  const description = (input.metaDescription ?? "").trim();
  const [titleMin, titleMax] = type.seo.titleRange;
  const [descMin, descMax] = type.seo.descriptionRange;

  checks.push(
    title
      ? {
          id: "title-exists",
          label: "Title",
          status: "pass",
          weight: 12,
          detail: "Your content has a title, which is used for the page title and social previews.",
        }
      : {
          id: "title-exists",
          label: "Title",
          status: "fail",
          weight: 12,
          detail: "Add a title. Without one, search engines and social cards have nothing to show.",
        },
  );

  checks.push({
    id: "title-length",
    label: "Title length",
    weight: 12,
    status: title.length >= titleMin && title.length <= titleMax ? "pass" : "warning",
    detail: `Your title is ${title.length} characters. Aim for ${titleMin}–${titleMax} so it isn't truncated in search results.`,
  });

  checks.push({
    id: "meta-description",
    label: "Meta description",
    weight: 12,
    status: description ? "pass" : "warning",
    detail: description
      ? "A meta description is set and will be used as the search snippet."
      : "No meta description yet. Write one summary sentence so search engines don't invent a snippet.",
  });

  if (description) {
    checks.push({
      id: "meta-description-length",
      label: "Description length",
      weight: 8,
      status: description.length >= descMin && description.length <= descMax ? "pass" : "warning",
      detail: `Your description is ${description.length} characters. Aim for ${descMin}–${descMax} characters.`,
    });
  }

  const h1Count = stats.headings.filter((h) => h.level === 1).length;
  checks.push({
    id: "single-h1",
    label: "H1 structure",
    weight: 10,
    status: !input.title.trim() ? "fail" : h1Count === 0 ? "pass" : "warning",
    detail: !input.title.trim()
      ? "Add a title — it is rendered as the page's only H1."
      : h1Count === 0
        ? "The title is the single H1 and the body starts at H2 — the recommended structure."
        : `The body contains ${h1Count} H1 heading(s). The title is already the H1; demote these to H2.`,
  });

  let hierarchyBreaks = 0;
  let previous = 0;
  for (const heading of stats.headings) {
    if (previous && heading.level > previous + 1) hierarchyBreaks += 1;
    previous = heading.level;
  }
  checks.push({
    id: "heading-hierarchy",
    label: "Heading hierarchy",
    weight: 8,
    status: stats.headings.length === 0 ? "warning" : hierarchyBreaks === 0 ? "pass" : "warning",
    detail:
      stats.headings.length === 0
        ? "No headings found. Headings make long content scannable for readers and crawlers."
        : hierarchyBreaks === 0
          ? "Heading levels increase one step at a time."
          : `${hierarchyBreaks} heading level${hierarchyBreaks > 1 ? "s" : ""} skip a step (for example H2 followed by H4).`,
  });

  checks.push({
    id: "content-length",
    label: "Content length",
    weight: 12,
    status: stats.words >= type.seo.minWords ? "pass" : "warning",
    detail: `${stats.words} words written. ${type.name} content performs best from around ${type.seo.minWords} words.`,
  });

  checks.push({
    id: "image-alt",
    label: "Image alt text",
    weight: 8,
    status: stats.images === 0 ? "info" : stats.imagesMissingAlt === 0 ? "pass" : "warning",
    detail:
      stats.images === 0
        ? "No images yet. A single relevant image improves comprehension and sharing."
        : stats.imagesMissingAlt === 0
          ? "Every image has alt text."
          : `${stats.imagesMissingAlt} of ${stats.images} images are missing alt text.`,
  });

  checks.push({
    id: "internal-links",
    label: "Internal links",
    weight: 8,
    status: stats.internalLinks > 0 ? "pass" : "warning",
    detail:
      stats.internalLinks > 0
        ? `${stats.internalLinks} internal link${stats.internalLinks > 1 ? "s" : ""} found.`
        : "Your article currently contains no internal links. Consider linking to related content.",
  });

  checks.push({
    id: "external-links",
    label: "External links",
    weight: 5,
    status: stats.externalLinks > 0 ? "pass" : "info",
    detail:
      stats.externalLinks > 0
        ? `${stats.externalLinks} external reference${stats.externalLinks > 1 ? "s" : ""} found.`
        : "No external references. Citing sources adds credibility, but it is optional.",
  });

  const keyword = (input.focusKeyword ?? "").trim().toLowerCase();
  if (keyword) {
    const plain = markdownToPlainText(input.markdown).toLowerCase();
    const inTitle = title.toLowerCase().includes(keyword);
    const occurrences = keyword ? plain.split(keyword).length - 1 : 0;
    checks.push({
      id: "keyword-presence",
      label: "Focus keyword",
      weight: 10,
      status: inTitle && occurrences > 0 ? "pass" : occurrences > 0 || inTitle ? "warning" : "fail",
      detail: `"${keyword}" appears ${occurrences} time${occurrences === 1 ? "" : "s"} in the body and is ${inTitle ? "present" : "missing"} in the title.`,
    });
  }

  const scored = checks.filter((c) => c.status !== "info");
  const totalWeight = scored.reduce((sum, c) => sum + c.weight, 0) || 1;
  const earned = scored.reduce(
    (sum, c) => sum + c.weight * (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0),
    0,
  );

  return { score: Math.round((earned / totalWeight) * 100), checks, stats };
}
