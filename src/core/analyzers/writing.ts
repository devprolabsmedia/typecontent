import { markdownToPlainText, type MarkdownBlock } from "@/lib/markdown/markdown";
import type { ContentTypeDefinition, SEOStatus } from "@/types/typecontent";

/**
 * Deterministic Writing analyzer. Writing is NOT SEO: it answers
 * "is this clear, readable and well structured?". No AI, no network, no React.
 * Heuristics are conservative and English-oriented; they are editorial
 * signals, not perfect linguistic analysis.
 */

export type WritingCategory =
  "readability" | "structure" | "clarity" | "repetition" | "completeness";

export type WritingRuleId =
  | "avgSentence"
  | "longSentences"
  | "avgParagraph"
  | "longParagraphs"
  | "complexWords"
  | "passiveVoice"
  | "transitions"
  | "introduction"
  | "h1Count"
  | "headingHierarchy"
  | "longSections"
  | "conclusion"
  | "thinSections"
  | "repeatedOpenings"
  | "fillerPhrases"
  | "repetition"
  | "completeness";

/** A content-type specific completeness signal, matched against heading text. */
export interface CompletenessSignal {
  label: string;
  keywords: string[];
  /** Also satisfied by a fenced code block. */
  codeCounts?: boolean;
}

export interface WritingConfig {
  rules: WritingRuleId[];
  completeness?: CompletenessSignal[];
}

export interface WritingCheck {
  id: WritingRuleId;
  category: WritingCategory;
  label: string;
  status: SEOStatus;
  message: string;
  details?: string;
  weight: number;
}

export interface WritingStats {
  sentences: number;
  avgSentenceWords: number;
  longSentences: number;
  paragraphs: number;
  avgParagraphSentences: number;
  longParagraphs: number;
  passivePercent: number;
  repeatedTerms: { term: string; count: number }[];
}

export interface WritingResult {
  /** "Writing Quality" 0-100. Never merged with the SEO score. */
  score: number;
  checks: WritingCheck[];
  categories: { id: WritingCategory; label: string; status: "good" | "ok" | "attention" }[];
  stats: WritingStats;
}

export const writingCategoryLabels: Record<WritingCategory, string> = {
  readability: "Readability",
  structure: "Structure",
  clarity: "Clarity",
  repetition: "Repetition",
  completeness: "Completeness",
};

const STOP = new Set(
  "a an the and or but if then so of to in on at by for with from as is are was were be been being it its this that these those you your we our they their i he she his her them not no can will would should could do does did have has had about into over than also just more most such only very what which who when where how all any each other some there here use using used one two".split(
    " ",
  ),
);
const FILLERS = [
  "very",
  "really",
  "basically",
  "actually",
  "just",
  "in order to",
  "kind of",
  "sort of",
  "quite",
  "literally",
];
const TRANSITIONS = [
  "however",
  "therefore",
  "for example",
  "for instance",
  "first",
  "next",
  "finally",
  "because",
  "as a result",
  "in addition",
  "instead",
  "meanwhile",
  "also",
  "then",
];
const PASSIVE =
  /\b(is|are|was|were|be|been|being)\s+(\w+ed|built|done|made|given|shown|written|taken|seen|known|found|sent|kept|held)\b/i;

export const sentencesOf = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
const wordsOf = (text: string) => text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
const syllables = (w: string) =>
  Math.max(1, (w.replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length);

interface Ctx {
  blocks: MarkdownBlock[];
  paragraphs: string[];
  sentences: string[];
  words: string[];
  sections: { title: string; level: number; words: number }[];
  config: WritingConfig;
}

type Outcome = Pick<WritingCheck, "status" | "message"> & { details?: string };
type Rule = {
  id: WritingRuleId;
  category: WritingCategory;
  label: string;
  weight: number;
  evaluate: (c: Ctx) => Outcome | null;
};

const pass = (message: string, details?: string): Outcome => ({
  status: "pass",
  message,
  ...(details ? { details } : {}),
});
const warn = (message: string, details?: string): Outcome => ({
  status: "warning",
  message,
  ...(details ? { details } : {}),
});
const info = (message: string, details?: string): Outcome => ({
  status: "info",
  message,
  ...(details ? { details } : {}),
});

const avg = (n: number, d: number) => (d ? Math.round((n / d) * 10) / 10 : 0);
const long = (s: string) => s.split(/\s+/).length > 35;

function repeated(words: string[]) {
  const counts = new Map<string, number>();
  for (const w of words) if (w.length > 3 && !STOP.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  const threshold = Math.max(6, Math.round(words.length * 0.02));
  return [...counts.entries()]
    .filter(([, c]) => c >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term, count]) => ({ term, count }));
}

const rules: Rule[] = [
  {
    id: "avgSentence",
    category: "readability",
    label: "Average sentence length",
    weight: 2,
    evaluate: (c) => {
      if (!c.sentences.length) return null;
      const a = avg(c.words.length, c.sentences.length);
      return a <= 20
        ? pass(`${a} words per sentence.`)
        : warn(`${a} words per sentence.`, "Aim for 20 or fewer on average.");
    },
  },
  {
    id: "longSentences",
    category: "readability",
    label: "Long sentences",
    weight: 2,
    evaluate: (c) => {
      if (!c.sentences.length) return null;
      const n = c.sentences.filter(long).length;
      return n === 0
        ? pass("No sentences over 35 words.")
        : warn(
            `${n} sentence${n > 1 ? "s are" : " is"} longer than 35 words.`,
            "Consider splitting them.",
          );
    },
  },
  {
    id: "avgParagraph",
    category: "readability",
    label: "Average paragraph length",
    weight: 1,
    evaluate: (c) => {
      if (!c.paragraphs.length) return null;
      const a = avg(
        c.paragraphs.reduce((s, p) => s + sentencesOf(p).length, 0),
        c.paragraphs.length,
      );
      return a <= 4 ? pass(`${a} sentences per paragraph.`) : warn(`${a} sentences per paragraph.`);
    },
  },
  {
    id: "longParagraphs",
    category: "readability",
    label: "Long paragraphs",
    weight: 2,
    evaluate: (c) => {
      if (!c.paragraphs.length) return null;
      const n = c.paragraphs.filter((p) => p.split(/\s+/).length > 150).length;
      return n === 0
        ? pass("No paragraphs over 150 words.")
        : warn(`${n} paragraph${n > 1 ? "s are" : " is"} unusually long.`);
    },
  },
  {
    id: "complexWords",
    category: "readability",
    label: "Complex words",
    weight: 1,
    evaluate: (c) => {
      if (c.words.length < 50) return null;
      const pct = Math.round(
        (c.words.filter((w) => syllables(w) >= 4).length / c.words.length) * 100,
      );
      return pct <= 10
        ? pass(`${pct}% of words have 4+ syllables.`)
        : warn(
            `${pct}% of words have 4+ syllables.`,
            "Estimated by syllable count; technical terms may be unavoidable.",
          );
    },
  },
  {
    id: "passiveVoice",
    category: "readability",
    label: "Passive voice",
    weight: 1,
    evaluate: (c) => {
      if (c.sentences.length < 5) return null;
      const pct = Math.round(
        (c.sentences.filter((s) => PASSIVE.test(s)).length / c.sentences.length) * 100,
      );
      return pct <= 15
        ? pass(`About ${pct}% of sentences.`)
        : warn(
            `About ${pct}% of sentences.`,
            "Detected by a simple pattern; may miss or over-count some cases.",
          );
    },
  },
  {
    id: "transitions",
    category: "readability",
    label: "Transition words",
    weight: 1,
    evaluate: (c) => {
      if (c.sentences.length < 8) return null;
      const n = c.sentences.filter((s) =>
        TRANSITIONS.some((t) => s.toLowerCase().includes(t)),
      ).length;
      const pct = Math.round((n / c.sentences.length) * 100);
      return pct >= 15
        ? pass(`${pct}% of sentences use transitions.`)
        : info(
            `${pct}% of sentences use transitions.`,
            "Words like 'however' or 'for example' help readers follow along.",
          );
    },
  },
  {
    id: "introduction",
    category: "structure",
    label: "Introduction",
    weight: 2,
    evaluate: (c) => {
      const first = c.blocks[0];
      if (!first) return warn("The document is empty.");
      return first.kind === "paragraph"
        ? pass("Opens with an introduction.")
        : warn("Starts without an introductory paragraph.");
    },
  },
  {
    id: "h1Count",
    category: "structure",
    label: "H1 structure",
    weight: 1,
    evaluate: (c) => {
      const n = c.blocks.filter((b) => b.kind === "heading" && b.level === 1).length;
      return n === 0
        ? pass("Title is the only H1.")
        : warn(
            `${n} extra H1 heading${n > 1 ? "s" : ""} in the body.`,
            "The title is already the H1; start body sections at H2.",
          );
    },
  },
  {
    id: "headingHierarchy",
    category: "structure",
    label: "Heading hierarchy",
    weight: 2,
    evaluate: (c) => {
      const levels = c.sections.map((s) => s.level);
      if (!levels.length) return info("No headings yet.");
      let prev = 1;
      for (const l of levels) {
        if (l > prev + 1) return warn(`Jumps from H${prev} to H${l}.`);
        prev = l;
      }
      return pass("Logical H2/H3 hierarchy.");
    },
  },
  {
    id: "longSections",
    category: "structure",
    label: "Section length",
    weight: 1,
    evaluate: (c) => {
      const big = c.sections.filter((s) => s.words > 600);
      return big.length
        ? warn(
            `"${big[0]?.title}" section is unusually long.`,
            "Consider splitting with sub-headings.",
          )
        : c.sections.length
          ? pass("Sections are balanced.")
          : null;
    },
  },
  {
    id: "conclusion",
    category: "structure",
    label: "Conclusion",
    weight: 1,
    evaluate: (c) => {
      if (c.sections.length < 2) return null;
      const last = c.sections.at(-1)?.title.toLowerCase() ?? "";
      return /conclu|summary|wrap|next step|takeaway|final/.test(last)
        ? pass("Ends with a conclusion.")
        : warn("No conclusion detected.");
    },
  },
  {
    id: "thinSections",
    category: "clarity",
    label: "Thin sections",
    weight: 1,
    evaluate: (c) => {
      if (c.sections.length < 3) return null;
      const n = c.sections.filter((s) => s.words < 15).length;
      return n > c.sections.length / 2
        ? warn(`${n} headings have very little content.`)
        : pass("Headings have content.");
    },
  },
  {
    id: "repeatedOpenings",
    category: "clarity",
    label: "Repeated sentence openings",
    weight: 1,
    evaluate: (c) => {
      if (c.sentences.length < 6) return null;
      let runs = 0;
      for (let i = 2; i < c.sentences.length; i++) {
        const w = (j: number) => wordsOf(c.sentences[j] ?? "")[0];
        if (w(i) && w(i) === w(i - 1) && w(i) === w(i - 2)) runs++;
      }
      return runs
        ? warn(`${runs} run${runs > 1 ? "s" : ""} of 3+ sentences start with the same word.`)
        : pass("Sentence openings vary.");
    },
  },
  {
    id: "fillerPhrases",
    category: "clarity",
    label: "Filler phrases",
    weight: 1,
    evaluate: (c) => {
      if (c.words.length < 50) return null;
      const text = ` ${c.words.join(" ")} `;
      const n = FILLERS.reduce((s, f) => s + text.split(` ${f} `).length - 1, 0);
      const per = (n / c.words.length) * 100;
      return per <= 1.5
        ? pass(`${n} filler word${n === 1 ? "" : "s"}.`)
        : warn(`${n} filler words (e.g. "very", "just", "basically").`);
    },
  },
  {
    id: "repetition",
    category: "repetition",
    label: "Repeated terms",
    weight: 1,
    evaluate: (c) => {
      if (c.words.length < 100) return null;
      const r = repeated(c.words);
      return r.length
        ? warn(
            r.map((t) => `"${t.term}" — ${t.count}`).join(", "),
            "Repetition of key terms can be intentional; consider synonyms where it reads awkwardly.",
          )
        : pass("No unusually frequent terms.");
    },
  },
  {
    id: "completeness",
    category: "completeness",
    label: "Content completeness",
    weight: 2,
    evaluate: (c) => {
      const signals = c.config.completeness ?? [];
      if (!signals.length) return null;
      const headings = c.sections.map((s) => s.title.toLowerCase()).join(" | ");
      const hasCode = c.blocks.some((b) => b.kind === "code");
      const missing = signals.filter(
        (s) => !(s.codeCounts && hasCode) && !s.keywords.some((k) => headings.includes(k)),
      );
      return missing.length === 0
        ? pass("All expected parts are present.")
        : info(
            `Consider: ${missing.map((m) => m.label).join(", ")}.`,
            "Editorial signals based on headings — not every piece needs all of them.",
          );
    },
  },
];

const byId = Object.fromEntries(rules.map((r) => [r.id, r])) as Record<WritingRuleId, Rule>;

const readability: WritingRuleId[] = [
  "avgSentence",
  "longSentences",
  "avgParagraph",
  "longParagraphs",
  "complexWords",
  "passiveVoice",
  "transitions",
];
const structure: WritingRuleId[] = ["introduction", "h1Count", "headingHierarchy", "longSections"];
const clarity: WritingRuleId[] = [
  "thinSections",
  "repeatedOpenings",
  "fillerPhrases",
  "repetition",
];

/** Rule sets referenced from ContentTypeDefinition.writing. */
export const writingRuleSets = {
  blog: {
    rules: [...readability, ...structure, "conclusion", ...clarity, "completeness"],
    completeness: [
      { label: "examples", keywords: ["example", "case", "demo"], codeCounts: true },
      { label: "conclusion", keywords: ["conclu", "summary", "wrap", "takeaway"] },
    ],
  },
  page: { rules: [...readability, ...structure, ...clarity] },
  docs: {
    rules: [...readability, ...structure, ...clarity, "completeness"],
    completeness: [
      { label: "overview", keywords: ["overview", "introduction", "about"] },
      { label: "prerequisites", keywords: ["prerequisite", "requirement", "before you"] },
      {
        label: "instructions",
        keywords: ["install", "setup", "set up", "usage", "getting started", "step"],
      },
      { label: "examples", keywords: ["example"], codeCounts: true },
      { label: "troubleshooting", keywords: ["troubleshoot", "faq", "common issue", "error"] },
    ],
  },
  knowledgeBase: { rules: [...readability, ...structure, ...clarity] },
  changelog: {
    rules: ["avgSentence", "longSentences", "h1Count", "headingHierarchy", "repetition"],
  },
  course: {
    rules: [...readability, ...structure, ...clarity, "completeness"],
    completeness: [
      { label: "objective", keywords: ["objective", "goal", "you will learn", "what you"] },
      { label: "explanation", keywords: ["how", "why", "concept", "overview"] },
      { label: "example", keywords: ["example"], codeCounts: true },
      { label: "exercise", keywords: ["exercise", "practice", "assignment", "challenge"] },
    ],
  },
} satisfies Record<string, WritingConfig>;

export const defaultWritingConfig: WritingConfig = {
  rules: [...readability, ...structure, ...clarity],
};

export function analyzeWriting(input: {
  contentType: ContentTypeDefinition;
  document: MarkdownBlock[];
}): WritingResult {
  const config = input.contentType.writing ?? defaultWritingConfig;
  const blocks = input.document;
  const paragraphs = blocks
    .filter((b): b is Extract<MarkdownBlock, { kind: "paragraph" }> => b.kind === "paragraph")
    .map((b) => markdownToPlainText(b.text));
  const prose = blocks
    .flatMap((b) =>
      b.kind === "paragraph" || b.kind === "callout"
        ? [b.text]
        : b.kind === "list"
          ? b.items
          : b.kind === "quote"
            ? b.lines
            : [],
    )
    .map(markdownToPlainText);
  const sentences = prose.flatMap(sentencesOf);
  const words = prose.flatMap(wordsOf);

  const sections: Ctx["sections"] = [];
  for (const b of blocks) {
    if (b.kind === "heading") sections.push({ title: b.text, level: b.level, words: 0 });
    else {
      const cur = sections.at(-1);
      const text =
        b.kind === "paragraph" || b.kind === "callout"
          ? b.text
          : b.kind === "list"
            ? b.items.join(" ")
            : "";
      if (cur) cur.words += wordsOf(text).length;
    }
  }

  const ctx: Ctx = { blocks, paragraphs, sentences, words, sections, config };
  const checks: WritingCheck[] = [];
  for (const id of config.rules) {
    const r = byId[id];
    const o = r?.evaluate(ctx);
    if (r && o) checks.push({ id, category: r.category, label: r.label, weight: r.weight, ...o });
  }

  const scored = checks.filter((c) => c.status !== "info");
  const total = scored.reduce((s, c) => s + c.weight, 0);
  const earned = scored.reduce(
    (s, c) => s + c.weight * (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0),
    0,
  );

  const cats = (Object.keys(writingCategoryLabels) as WritingCategory[])
    .map((id) => {
      const list = checks.filter((c) => c.category === id && c.status !== "info");
      if (!checks.some((c) => c.category === id)) return null;
      const bad = list.filter((c) => c.status !== "pass").length;
      const status: "good" | "ok" | "attention" =
        bad === 0 ? "good" : bad === 1 ? "ok" : "attention";
      return { id, label: writingCategoryLabels[id], status };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return {
    score: total ? Math.round((earned / total) * 100) : 0,
    checks,
    categories: cats,
    stats: {
      sentences: sentences.length,
      avgSentenceWords: avg(words.length, sentences.length),
      longSentences: sentences.filter(long).length,
      paragraphs: paragraphs.length,
      avgParagraphSentences: avg(
        paragraphs.reduce((s, p) => s + sentencesOf(p).length, 0),
        paragraphs.length,
      ),
      longParagraphs: paragraphs.filter((p) => p.split(/\s+/).length > 150).length,
      passivePercent: sentences.length
        ? Math.round((sentences.filter((s) => PASSIVE.test(s)).length / sentences.length) * 100)
        : 0,
      repeatedTerms: words.length >= 100 ? repeated(words) : [],
    },
  };
}
