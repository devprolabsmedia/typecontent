import DOMPurify from "dompurify";
import TurndownService from "turndown";

import {
  parseMarkdown,
  renderMarkdown,
  serializeMarkdown,
  type MarkdownBlock,
} from "@/lib/markdown/markdown";

/**
 * Import / export boundaries around the canonical document (MarkdownBlock[]).
 * Markdown is the portable serialization; HTML is sanitized before it is
 * interpreted. Pure of React. HTML import needs a DOM (browser).
 */

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "del",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "img",
  "hr",
  "aside",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "data-callout", "data-lang"];
const SAFE_URL = /^(?:https?:|mailto:|\/|#|\.\.?\/)/i;

export function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") return "";
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: SAFE_URL,
  });
  return typeof clean === "string" ? clean : String(clean);
}

let turndown: TurndownService | null = null;
function getTurndown() {
  if (turndown) return turndown;
  const t = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    hr: "---",
  });
  t.addRule("underline", { filter: ["u"], replacement: (c) => `<u>${c}</u>` });
  t.addRule("strike", { filter: ["del", "s"], replacement: (c) => `~~${c}~~` });
  t.addRule("callout", {
    filter: (n) => n.nodeName === "ASIDE",
    replacement: (c, n) =>
      `\n\n:::callout ${(n as HTMLElement).getAttribute("data-callout") || "info"}\n${c.trim()}\n:::\n\n`,
  });
  t.addRule("fencedLang", {
    filter: (n) => n.nodeName === "PRE",
    replacement: (_c, n) => {
      const el = n as HTMLElement;
      const lang =
        el.getAttribute("data-lang") ||
        (el.querySelector("code")?.className.match(/language-(\w+)/)?.[1] ?? "");
      return `\n\n\`\`\`${lang}\n${(el.textContent ?? "").replace(/\n$/, "")}\n\`\`\`\n\n`;
    },
  });
  turndown = t;
  return t;
}

export function importMarkdown(markdown: string): MarkdownBlock[] {
  return parseMarkdown(markdown);
}

export function exportMarkdown(document: MarkdownBlock[]): string {
  return serializeMarkdown(document);
}

/** HTML -> sanitizer -> parser -> canonical document. Browser only. */
export function importHTML(html: string): MarkdownBlock[] {
  return parseMarkdown(htmlToMarkdown(html));
}

export function htmlToMarkdown(html: string): string {
  const clean = sanitizeHTML(html);
  if (!clean.trim()) return "";
  // Turndown escapes markdown-looking text; keep "1." etc readable.
  return getTurndown()
    .turndown(clean)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Canonical document -> HTML. Sanitized again when a DOM is available. */
export function exportHTML(document: MarkdownBlock[]): string {
  const raw = renderMarkdown(serializeMarkdown(document));
  const html = typeof window === "undefined" ? raw : sanitizeHTML(raw);
  return html
    .replace(/(<\/(?:h\d|p|pre|ul|ol|blockquote|aside|table)>|<hr\s*\/?>)/g, "$1\n")
    .trim();
}
