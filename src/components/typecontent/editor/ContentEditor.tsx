import { useState } from "react";

import { contentTypes } from "@/core/content-types/registry";
import { cn } from "@/lib/utils";
import type { EditorMode } from "@/types/typecontent";

import { CopyToProjectDialog } from "./CopyToProjectDialog";
import { DocumentRenderer } from "./DocumentRenderer";
import { EditorToolbar } from "./EditorToolbar";
import { MetadataPanel } from "./MetadataPanel";
import { SEOPanel } from "./SEOPanel";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { useContentEditor } from "./useContentEditor";
import { useSlashCommands } from "./useSlashCommands";

export function ContentEditor({ initialType = "blog" }: { initialType?: string }) {
  const ed = useContentEditor(initialType);
  const [mode, setMode] = useState<EditorMode>("split");
  const [tab, setTab] = useState<"seo" | "metadata">("seo");
  const slash = useSlashCommands(ed.textareaRef, ed.applyEdit);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
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
        <span
          aria-label={`Status: ${ed.status}`}
          className="rounded border border-border px-2 py-1 font-mono text-xs capitalize text-muted-foreground"
        >
          {ed.status}
        </span>
        <div className="ml-auto">
          <CopyToProjectDialog
            contentTypeId={ed.contentTypeId}
            title={ed.title}
            markdown={ed.markdown}
          />
        </div>
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
          <input
            value={ed.title}
            onChange={(e) => ed.setTitle(e.target.value)}
            placeholder="Untitled"
            aria-label="Title"
            className="w-full border-b border-border bg-transparent px-5 py-4 text-2xl font-semibold tracking-tight outline-none"
          />
          <div className={cn("relative grid md:min-h-[620px]", mode === "split" && "md:grid-cols-2")}>
            {mode !== "preview" && (
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
            {slash.slash.open && mode !== "preview" && (
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
            {(["seo", "metadata"] as const).map((t) => (
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
                {t === "seo" ? "SEO" : "Metadata"}
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
