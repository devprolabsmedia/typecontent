import type {
  ContentStats,
  ContentTypeDefinition,
  Lesson,
  Metadata,
  SEOCategory,
  SEOCheck,
  SEOData,
  SEORuleId,
  SEOStatus,
} from "@/types/typecontent";

import { isLessonList } from "@/core/content/lessons";

/**
 * SEO rule registry. Each rule is implemented once; content types pick which
 * rules run via `contentType.seo.rules`. Rules are pure and deterministic.
 */

export interface SEOContext {
  type: ContentTypeDefinition;
  /** Effective SEO title (SEO override or content title). */
  title: string;
  markdown: string;
  plain: string;
  seo: SEOData;
  metadata: Metadata;
  stats: ContentStats;
}

interface Outcome {
  status: SEOStatus;
  message: string;
}

export interface SEORule {
  id: SEORuleId;
  label: string;
  category: SEOCategory;
  weight: number;
  /** What it means, why it matters, what to do. Kept short. */
  details: string;
  /** Return null when the rule does not apply (e.g. no keyword set). */
  evaluate(ctx: SEOContext): Outcome | null;
}

const ok = (message: string): Outcome => ({ status: "pass", message });
const warn = (message: string): Outcome => ({ status: "warning", message });
const err = (message: string): Outcome => ({ status: "error", message });
const info = (message: string): Outcome => ({ status: "info", message });

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LINK_RE = /(!?)\[([^\]]*)\]\(([^)]*)\)/g;

function keyword(ctx: SEOContext): string {
  return (ctx.seo.focusKeyword ?? "").trim().toLowerCase();
}

function paragraphs(markdown: string): string[] {
  return markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(#|```|>|[-*] |\d+\. |!\[|\||:::)/.test(p));
}

function lessons(ctx: SEOContext): Lesson[] {
  const v = ctx.metadata["lessons"];
  return isLessonList(v) ? v : [];
}

function courseDescription(ctx: SEOContext): string {
  return String(ctx.metadata["description"] ?? "").trim() || (paragraphs(ctx.markdown)[0] ?? "");
}

const rules: SEORule[] = [
  {
    id: "title",
    label: "SEO title",
    category: "basic",
    weight: 12,
    details: "Search results and social cards show this title. Add one that says what the page is.",
    evaluate: (c) => (c.title ? ok("A title is set.") : err("Missing — add a title.")),
  },
  {
    id: "titleLength",
    label: "Title length",
    category: "basic",
    weight: 10,
    details: "Titles outside the range are often cut off in search results. Tighten or expand it.",
    evaluate: (c) => {
      if (!c.title) return null;
      const [min, max] = c.type.seo.titleRange;
      const n = c.title.length;
      return n >= min && n <= max
        ? ok(`${n} characters — good.`)
        : warn(`${n} characters. Recommended ${min}–${max}.`);
    },
  },
  {
    id: "metaDescription",
    label: "Meta description",
    category: "basic",
    weight: 12,
    details:
      "The description is the suggested search snippet. Without it, search engines pick text for you.",
    evaluate: (c) =>
      (c.seo.description ?? "").trim()
        ? ok("A description is set.")
        : warn("Missing — write one summary sentence."),
  },
  {
    id: "metaDescriptionLength",
    label: "Description length",
    category: "basic",
    weight: 6,
    details: "Keep the snippet long enough to be useful and short enough not to be truncated.",
    evaluate: (c) => {
      const d = (c.seo.description ?? "").trim();
      if (!d) return null;
      const [min, max] = c.type.seo.descriptionRange;
      return d.length >= min && d.length <= max
        ? ok(`${d.length} characters — good.`)
        : warn(`${d.length} characters. Recommended ${min}–${max}.`);
    },
  },
  {
    id: "slug",
    label: "URL slug",
    category: "basic",
    weight: 8,
    details: "A short lowercase slug with hyphens makes the URL readable. Example: pricing-faq.",
    evaluate: (c) => {
      const slug = String(c.metadata["slug"] ?? "").trim();
      if (!slug) return warn("Missing — add a slug.");
      return SLUG_RE.test(slug)
        ? ok(`/${slug}`)
        : warn("Use lowercase letters, numbers and hyphens only.");
    },
  },
  {
    id: "headingStructure",
    label: "Heading structure",
    category: "content",
    weight: 10,
    details:
      "The title is the page's only H1. Body sections should start at H2 so the outline stays clear.",
    evaluate: (c) => {
      if (!c.title) return err("Add a title — it is rendered as the only H1.");
      const h1 = c.stats.headings.filter((h) => h.level === 1).length;
      if (h1 > 0) return warn(`${h1} H1 in the body. Change them to H2.`);
      if (c.stats.headings.length === 0) return warn("No section headings yet.");
      return ok("One H1 (the title), sections start at H2.");
    },
  },
  {
    id: "headingHierarchy",
    label: "Heading hierarchy",
    category: "content",
    weight: 6,
    details: "Skipping levels (H2 straight to H4) makes the outline harder to follow.",
    evaluate: (c) => {
      if (c.stats.headings.length === 0) return null;
      let breaks = 0;
      let prev = 0;
      for (const h of c.stats.headings) {
        if (prev && h.level > prev + 1) breaks += 1;
        prev = h.level;
      }
      return breaks === 0
        ? ok("Levels step down one at a time.")
        : warn(`${breaks} skipped level(s).`);
    },
  },
  {
    id: "toc",
    label: "Table of contents",
    category: "structure",
    weight: 6,
    details: "Docs readers navigate by headings. Three or more H2/H3 sections make a useful TOC.",
    evaluate: (c) => {
      const n = c.stats.headings.filter((h) => h.level === 2 || h.level === 3).length;
      return n >= 3 ? ok(`${n} sections for the TOC.`) : warn(`${n} section(s). Recommended 3+.`);
    },
  },
  {
    id: "contentLength",
    label: "Content length",
    category: "content",
    weight: 10,
    details: "Thin pages rarely answer the reader's question. Aim for the recommended minimum.",
    evaluate: (c) => {
      const min = c.type.seo.minWords;
      return c.stats.words >= min
        ? ok(`${c.stats.words} words — good.`)
        : warn(`${c.stats.words} words. Recommended ${min}+.`);
    },
  },
  {
    id: "keyword",
    label: "Focus keyword",
    category: "content",
    weight: 6,
    details: "Pick the phrase readers would search for, then use it naturally in the text.",
    evaluate: (c) => {
      const k = keyword(c);
      if (!k) return info("Not set — optional, but helps focus the article.");
      const n = c.plain.toLowerCase().split(k).length - 1;
      if (n === 0) return err(`"${k}" does not appear in the body.`);
      return n <= 8
        ? ok(`Used ${n} time${n === 1 ? "" : "s"}.`)
        : warn(`Used ${n} times — may read as stuffing.`);
    },
  },
  {
    id: "keywordInTitle",
    label: "Keyword in title",
    category: "content",
    weight: 8,
    details: "Having the focus keyword in the title confirms what the page is about.",
    evaluate: (c) => {
      const k = keyword(c);
      if (!k) return null;
      return c.title.toLowerCase().includes(k) ? ok("Present.") : warn("Missing from the title.");
    },
  },
  {
    id: "keywordInIntro",
    label: "Keyword in introduction",
    category: "content",
    weight: 6,
    details:
      "Mentioning the topic in the first paragraph tells readers they're in the right place.",
    evaluate: (c) => {
      const k = keyword(c);
      if (!k) return null;
      const intro = (paragraphs(c.markdown)[0] ?? "").toLowerCase();
      return intro.includes(k)
        ? ok("Present in the first paragraph.")
        : warn("Not in the first paragraph.");
    },
  },
  {
    id: "internalLinks",
    label: "Internal links",
    category: "links",
    weight: 8,
    details: "Links to related pages help readers continue and help crawlers discover content.",
    evaluate: (c) =>
      c.stats.internalLinks > 0
        ? ok(`${c.stats.internalLinks} found.`)
        : warn("None — link to related content."),
  },
  {
    id: "externalLinks",
    label: "External links",
    category: "links",
    weight: 4,
    details: "Citing sources adds credibility. Optional.",
    evaluate: (c) =>
      c.stats.externalLinks > 0 ? ok(`${c.stats.externalLinks} found.`) : info("None — optional."),
  },
  {
    id: "emptyLinks",
    label: "Empty link targets",
    category: "links",
    weight: 6,
    details: "Links with an empty target or `#` lead nowhere. Fill them in or remove them.",
    evaluate: (c) => {
      let empty = 0;
      let total = 0;
      for (const m of c.markdown.matchAll(LINK_RE)) {
        if (m[1]) continue;
        total += 1;
        const href = (m[3] ?? "").trim();
        if (!href || href === "#") empty += 1;
      }
      if (total === 0) return null;
      return empty === 0 ? ok("All links have targets.") : err(`${empty} link(s) have no target.`);
    },
  },
  {
    id: "imageAlt",
    label: "Image alt text",
    category: "media",
    weight: 8,
    details: "Alt text describes images for screen readers and image search.",
    evaluate: (c) => {
      if (c.stats.images === 0) return info("No images.");
      return c.stats.imagesMissingAlt === 0
        ? ok(`${c.stats.images} image(s), all with alt text.`)
        : warn(`${c.stats.imagesMissingAlt} of ${c.stats.images} missing alt text.`);
    },
  },
  {
    id: "paragraphLength",
    label: "Paragraph length",
    category: "readability",
    weight: 5,
    details: "Paragraphs over ~150 words are hard to scan on screens. Split long ones.",
    evaluate: (c) => {
      const long = paragraphs(c.markdown).filter((p) => p.split(/\s+/).length > 150).length;
      return long === 0
        ? ok("Paragraphs are a readable length.")
        : warn(`${long} long paragraph(s).`);
    },
  },
  {
    id: "sentenceLength",
    label: "Sentence length",
    category: "readability",
    weight: 5,
    details: "Measured by word count only. Many sentences over 25 words slow readers down.",
    evaluate: (c) => {
      const sentences = c.plain.split(/[.!?]+\s/).filter((s) => s.trim());
      if (sentences.length === 0) return null;
      const long = sentences.filter((s) => s.split(/\s+/).length > 25).length;
      const pct = Math.round((long / sentences.length) * 100);
      return pct <= 25
        ? ok(`${pct}% long sentences.`)
        : warn(`${pct}% of sentences exceed 25 words.`);
    },
  },
  {
    id: "relatedContent",
    label: "Related content",
    category: "links",
    weight: 6,
    details: "Related articles keep readers in the help center instead of opening a ticket.",
    evaluate: (c) => {
      const v = c.metadata["relatedArticles"];
      const n = Array.isArray(v) ? v.length : 0;
      return n > 0 ? ok(`${n} related article(s).`) : warn("None — add related articles.");
    },
  },
  {
    id: "releaseInfo",
    label: "Release information",
    category: "structure",
    weight: 8,
    details: "Readers scan changelogs by version and date. Set both.",
    evaluate: (c) => {
      const v = String(c.metadata["version"] ?? "").trim();
      const d = String(c.metadata["releaseDate"] ?? "").trim();
      if (v && d) return ok(`${v} · ${d}`);
      return warn(
        `Missing ${[!v && "version", !d && "release date"].filter(Boolean).join(" and ")}.`,
      );
    },
  },
  {
    id: "courseDescription",
    label: "Course description",
    category: "content",
    weight: 8,
    details: "Learners decide from the description. Say who it's for and what they'll build.",
    evaluate: (c) => {
      const n = courseDescription(c).split(/\s+/).filter(Boolean).length;
      if (n === 0) return err("Missing — describe the course.");
      return n >= 20 ? ok(`${n} words.`) : warn(`${n} words — too short. Recommended 20+.`);
    },
  },
  {
    id: "lessonCount",
    label: "Lesson count",
    category: "structure",
    weight: 10,
    details: "A course needs lessons. Break the material into focused steps.",
    evaluate: (c) => {
      const n = lessons(c).length;
      return n === 0 ? err("Course has no lessons.") : ok(`${n} lesson${n === 1 ? "" : "s"}.`);
    },
  },
  {
    id: "lessonTitles",
    label: "Lessons have titles",
    category: "structure",
    weight: 8,
    details: "Lesson titles form the course outline shown to learners.",
    evaluate: (c) => {
      const list = lessons(c);
      if (list.length === 0) return null;
      const missing = list.filter((l) => !l.title.trim()).length;
      return missing === 0
        ? ok("Every lesson has a title.")
        : warn(`${missing} lesson(s) missing a title.`);
    },
  },
  {
    id: "lessonOrder",
    label: "Lesson ordering",
    category: "structure",
    weight: 4,
    details: "Lessons should be numbered 1, 2, 3… without gaps or duplicates.",
    evaluate: (c) => {
      const list = lessons(c);
      if (list.length === 0) return null;
      const valid = [...list]
        .map((l) => l.order)
        .sort((a, b) => a - b)
        .every((o, i) => o === i + 1);
      return valid ? ok("Ordered 1–" + list.length + ".") : warn("Order has gaps or duplicates.");
    },
  },
];

export const seoRules: Record<SEORuleId, SEORule> = Object.fromEntries(
  rules.map((r) => [r.id, r]),
) as Record<SEORuleId, SEORule>;

export const seoCategoryLabels: Record<SEOCategory, string> = {
  basic: "Basic SEO",
  content: "Content",
  structure: "Structure",
  links: "Links",
  media: "Media",
  readability: "Readability",
};

export function runRules(ids: SEORuleId[], ctx: SEOContext): SEOCheck[] {
  const checks: SEOCheck[] = [];
  for (const id of ids) {
    const rule = seoRules[id];
    if (!rule) continue;
    const outcome = rule.evaluate(ctx);
    if (!outcome) continue;
    checks.push({
      id: rule.id,
      label: rule.label,
      category: rule.category,
      weight: rule.weight,
      details: rule.details,
      ...outcome,
    });
  }
  return checks;
}

/* ---------- Rule sets per content type ---------- */

const basic: SEORuleId[] = ["title", "titleLength", "metaDescription", "metaDescriptionLength"];

export const seoRuleSets = {
  blog: [
    ...basic,
    "keyword",
    "keywordInTitle",
    "keywordInIntro",
    "headingStructure",
    "headingHierarchy",
    "contentLength",
    "internalLinks",
    "externalLinks",
    "emptyLinks",
    "imageAlt",
    "paragraphLength",
    "sentenceLength",
  ],
  page: [...basic, "slug", "headingStructure", "headingHierarchy", "imageAlt", "emptyLinks"],
  docs: [
    ...basic,
    "headingStructure",
    "headingHierarchy",
    "toc",
    "internalLinks",
    "emptyLinks",
    "imageAlt",
  ],
  knowledgeBase: [...basic, "headingStructure", "internalLinks", "relatedContent", "emptyLinks"],
  changelog: [...basic, "releaseInfo", "headingStructure"],
  course: [
    ...basic,
    "courseDescription",
    "headingStructure",
    "lessonCount",
    "lessonTitles",
    "lessonOrder",
  ],
  default: [...basic, "headingStructure", "contentLength", "internalLinks", "imageAlt"],
} satisfies Record<string, SEORuleId[]>;
