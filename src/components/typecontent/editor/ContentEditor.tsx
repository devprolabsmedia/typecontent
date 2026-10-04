import { useEffect, useRef, useState } from "react";

import { contentTypes, registerContentType } from "@/core/content-types/registry";
import { cn } from "@/lib/utils";
import type { ContentTypeDefinition, EditorMode } from "@/types/typecontent";

import { CopyToProjectDialog } from "./CopyToProjectDialog";
import { DocumentRenderer } from "./DocumentRenderer";
import { EditorToolbar } from "./EditorToolbar";
import { MetadataPanel } from "./MetadataPanel";
import { SEOPanel } from "./SEOPanel";
import { WritingPanel } from "./WritingPanel";
import { exportHTML, htmlToMarkdown } from "@/core/content/io";
import { parseMarkdown } from "@/lib/markdown/markdown";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { useContentEditor, type ContentEditorValue } from "./useContentEditor";
import { useSlashCommands } from "./useSlashCommands";

export interface ContentEditorChange extends Required<ContentEditorValue> {
  contentTypeId: string;
}

export interface ContentEditorProps {
  /** Built-in id ("blog") or a definition from defineContentType(). */
  contentType?: string | ContentTypeDefinition;
  /** Initial document. Defaults to demo content for built-in types. */
  value?: ContentEditorValue;
  onChange?: (content: ContentEditorChange) => void;
  /** Show the content-type switcher. Defaults to true only in the playground usage. */
  showTypeSwitcher?: boolean;
  /** Show the "Copy to Project" button (playground only). */
  showCopyToProject?: boolean;
}

export function ContentEditor({
  contentType = "blog",
  value,
  onChange,
  showTypeSwitcher = true,
  showCopyToProject = false,
}: ContentEditorProps) {
  const typeId = typeof contentType === "string" ? contentType : contentType.id;
  if (typeof contentType !== "string") registerContentType(contentType);
  const ed = useContentEditor(typeId, value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { title, markdown, metaDescription, focusKeyword, metadata, contentTypeId } = ed;
  useEffect(() => {
    onChangeRef.current?.({
      contentTypeId,
      title,
      markdown,
      metaDescription,
      focusKeyword,
      metadata,
    });
  }, [contentTypeId, title, markdown, metaDescription, focusKeyword, metadata]);
  const [mode, setMode] = useState<EditorMode>("split");
  const [tab, setTab] = useState<"seo" | "writing" | "metadata">("seo");
  const [format, setFormat] = useState<"markdown" | "html">("markdown");
  const [html, setHtml] = useState("");
  const fromHtml = useRef(false);
  const [copied, setCopied] = useState<string | null>(null);
  // Focus Mode: "words" = 3-Word Focus (extreme), "editor" = Editor Focus.
  const [focus, setFocus] = useState<null | "words" | "editor">(null);
  const [focusMenu, setFocusMenu] = useState(false);
  const [dim, setDim] = useState(false);
  const wordMark = useRef(0);
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);
  const enterFocus = (mode: "words" | "editor") => {
    setFocusMenu(false);
    setDim(false);
    wordMark.current = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    setFocus(mode);
  };
  useEffect(() => {
    if (format !== "html") return;
    if (fromHtml.current) {
      fromHtml.current = false;
      return;
    }
    setHtml(exportHTML(parseMarkdown(markdown)));
  }, [format, markdown]);
  const copy = async (kind: "HTML" | "Markdown") => {
    const text = kind === "HTML" ? exportHTML(parseMarkdown(markdown)) : markdown;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };
  const slash = useSlashCommands(ed.textareaRef, ed.applyEdit);

  return (
    <div
      className={cn(
        "mx-auto max-w-[1600px] space-y-4 px-4 py-6",
        focus && "fixed inset-0 z-50 max-w-none overflow-y-auto bg-background",
      )}
    >
      {focus && (
        <div
          className={cn(
            "flex items-center justify-between transition-opacity duration-500",
            dim && focus === "words" && "opacity-20 focus-within:opacity-100 hover:opacity-100",
          )}
        >
          <span className="font-mono text-xs text-muted-foreground">
            {focus === "words" ? "3-Word Focus" : "Editor Focus"}
          </span>
          <button
            onClick={() => setFocus(null)}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Exit Focus (Esc)
          </button>
        </div>
      )}
      {!focus && (
      <div className="flex flex-wrap items-center gap-2">
        {showTypeSwitcher && (
          <div
            role="group"
            aria-label="Content type"
            className="flex max-w-full flex-wrap gap-1 rounded-lg border border-border bg-surface p-1"
          >
            {contentTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => ed.changeContentType(t.id)}
                aria-pressed={ed.contentTypeId === t.id}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  ed.contentTypeId === t.id && "bg-secondary text-foreground",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
        <span
          aria-label={`Status: ${ed.status}`}
          className="rounded border border-border px-2 py-1 font-mono text-xs capitalize text-muted-foreground"
        >
          {ed.status}
        </span>
        <div className="ml-auto flex gap-1" aria-live="polite">
          {(["HTML", "Markdown"] as const).map((k) => (
            <button
              key={k}
              onClick={() => void copy(k)}
              className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === k ? "✓ Copied" : `Copy ${k}`}
            </button>
          ))}
        </div>
        {showCopyToProject && (
          <div>
            <CopyToProjectDialog contentType={ed.contentType} />
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="panel overflow-hidden rounded-lg border border-border bg-surface">
          <EditorToolbar
            onCommand={ed.runCommand}
            onUndo={ed.undo}
            onRedo={ed.redo}
            canUndo={ed.canUndo}
            canRedo={ed.canRedo}
            mode={mode}
            onModeChange={setMode}
          />
          {mode !== "preview" && (
            <div
              role="tablist"
              aria-label="Editing format"
              className="flex gap-1 border-b border-border px-3 py-1.5 text-xs"
            >
              {(["markdown", "html"] as const).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={format === f}
                  onClick={() => setFormat(f)}
                  className={cn(
                    "rounded px-2.5 py-1 text-muted-foreground",
                    format === f && "bg-secondary text-foreground",
                  )}
                >
                  {f === "markdown" ? "Markdown" : "HTML"}
                </button>
              ))}
              {format === "html" && (
                <span className="ml-auto self-center text-muted-foreground">
                  Pasted HTML is cleaned; scripts and unsafe links are removed.
                </span>
              )}
            </div>
          )}
          <input
            value={ed.title}
            onChange={(e) => ed.setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Title"
            className="w-full border-b border-border bg-transparent px-5 py-4 text-2xl font-semibold tracking-tight outline-none"
          />
          <div
            className={cn("relative grid md:min-h-[620px]", mode === "split" && "md:grid-cols-2")}
          >
            {mode !== "preview" && format === "html" && (
              <textarea
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  fromHtml.current = true;
                  ed.setMarkdown(htmlToMarkdown(e.target.value));
                }}
                spellCheck={false}
                wrap="off"
                aria-label="HTML"
                className="h-[420px] w-full resize-none overflow-auto bg-transparent p-5 font-mono text-sm leading-relaxed outline-none md:h-[620px]"
              />
            )}
            {mode !== "preview" && format === "markdown" && (
              <textarea
                ref={ed.textareaRef}
                value={ed.markdown}
                onChange={(e) => {
                  ed.setMarkdown(e.target.value);
                  slash.sync(e.target.value, e.target.selectionStart);
                }}
                onKeyDown={(e) => {
                  if (slash.handleKey(e)) {
                    e.preventDefault();
                    return;
                  }
                  const mod = e.metaKey || e.ctrlKey;
                  if (!mod) return;
                  const k = e.key.toLowerCase();
                  if (k === "z") {
                    e.preventDefault();
                    if (e.shiftKey) ed.redo();
                    else ed.undo();
                  } else if (k === "b") {
                    e.preventDefault();
                    ed.runCommand("bold");
                  } else if (k === "i") {
                    e.preventDefault();
                    ed.runCommand("italic");
                  } else if (k === "u") {
                    e.preventDefault();
                    ed.runCommand("underline");
                  } else if (k === "k") {
                    e.preventDefault();
                    ed.runCommand("link");
                  }
                }}
                spellCheck={false}
                aria-label="Markdown"
                className="h-[420px] md:h-[620px] w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed outline-none"
              />
            )}
            {mode !== "edit" && (
              <div
                className={cn(
                  "h-[420px] overflow-y-auto p-6 md:h-[620px]",
                  mode === "split" && "border-t border-border md:border-l md:border-t-0",
                )}
              >
                <h1 className="mb-4 text-3xl font-semibold tracking-tight">
                  {ed.title || "Untitled"}
                </h1>
                <DocumentRenderer markdown={ed.markdown} />
              </div>
            )}
            {slash.slash.open && mode !== "preview" && format === "markdown" && (
              <SlashCommandMenu
                commands={slash.commands}
                active={slash.slash.active}
                top={slash.slash.top}
                left={slash.slash.left}
                onSelect={slash.apply}
              />
            )}
          </div>
        </div>

        <aside className="panel rounded-lg border border-border bg-surface">
          <div
            role="tablist"
            aria-label="Side panel"
            className="flex border-b border-border text-sm"
          >
            {(["seo", "writing", "metadata"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls="side-panel"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-muted-foreground",
                  tab === t && "border-b-2 border-primary text-foreground",
                )}
              >
                {t === "seo" ? "SEO" : t === "writing" ? "Writing" : "Metadata"}
              </button>
            ))}
          </div>
          <div className="p-4" role="tabpanel" id="side-panel" aria-labelledby={`tab-${tab}`}>
            {tab === "seo" ? (
              <SEOPanel
                seo={ed.seo}
                enabled={ed.contentType.seo.enabled}
                metaDescription={ed.metaDescription}
                onMetaDescription={ed.setMetaDescription}
                focusKeyword={ed.focusKeyword}
                onFocusKeyword={ed.setFocusKeyword}
              />
            ) : tab === "writing" ? (
              <WritingPanel writing={ed.writing} />
            ) : (
              <MetadataPanel
                type={ed.contentType}
                metadata={ed.metadata}
                onChange={ed.updateMetadata}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
