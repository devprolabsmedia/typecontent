/**
 * Block registry: the extension point for document blocks.
 *
 * The editor never special-cases content types; it renders whatever blocks
 * are registered here. Future developers add custom blocks by calling
 * registerBlock — no core editor changes required.
 */

import type { MarkdownBlockKind } from "@/lib/markdown/markdown";

export interface BlockDefinition {
  /** Document node kind, e.g. "paragraph" or "callout". */
  type: MarkdownBlockKind | (string & {});
  /** Human-readable name shown in menus. */
  name: string;
  /** Extra terms used by slash-command filtering, e.g. ["h1", "title"]. */
  keywords: string[];
  /** Markdown inserted when the block is chosen from the slash menu. */
  template: string;
  /** Where the caret lands inside the template (offset from template start). */
  caretOffset?: number;
}

const blocks = new Map<string, BlockDefinition>();

export function registerBlock(def: BlockDefinition): void {
  blocks.set(def.type, def);
}

export function getBlock(type: string): BlockDefinition | undefined {
  return blocks.get(type);
}

export function listBlocks(): BlockDefinition[] {
  return [...blocks.values()];
}

/* ---------- Built-in blocks ---------- */

registerBlock({ type: "paragraph", name: "Paragraph", keywords: ["text", "plain"], template: "" });
registerBlock({ type: "heading-1", name: "Heading 1", keywords: ["h1", "title"], template: "# " });
registerBlock({ type: "heading-2", name: "Heading 2", keywords: ["h2", "subtitle"], template: "## " });
registerBlock({ type: "heading-3", name: "Heading 3", keywords: ["h3", "section"], template: "### " });
registerBlock({ type: "bullet-list", name: "Bullet List", keywords: ["ul", "unordered", "list"], template: "- " });
registerBlock({ type: "ordered-list", name: "Numbered List", keywords: ["ol", "ordered", "list"], template: "1. " });
registerBlock({ type: "quote", name: "Quote", keywords: ["blockquote", "citation"], template: "> " });
registerBlock({
  type: "code-block",
  name: "Code Block",
  keywords: ["code", "pre", "snippet"],
  template: "```ts\n\n```",
  caretOffset: 6,
});
registerBlock({
  type: "image",
  name: "Image",
  keywords: ["img", "picture", "media"],
  template: "![alt text](https://)",
  caretOffset: 2,
});
registerBlock({ type: "divider", name: "Divider", keywords: ["hr", "rule", "separator"], template: "---" });

/* ---------- Example custom block ---------- */

registerBlock({
  type: "callout",
  name: "Callout",
  keywords: ["info", "warning", "success", "danger", "note", "alert"],
  template: ":::callout info\nImportant information.\n:::",
  caretOffset: 16,
});
