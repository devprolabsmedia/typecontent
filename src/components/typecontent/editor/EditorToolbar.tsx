import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import type { ComponentType } from "react";

import type { MarkdownCommandId } from "@/core/content/markdown-commands";
import { cn } from "@/lib/utils";
import type { EditorMode } from "@/types/typecontent";

const groups: {
  id: MarkdownCommandId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[][] = [
  [
    { id: "bold", label: "Bold", icon: Bold },
    { id: "italic", label: "Italic", icon: Italic },
    { id: "underline", label: "Underline", icon: Underline },
    { id: "strike", label: "Strikethrough", icon: Strikethrough },
  ],
  [
    { id: "h1", label: "Heading 1", icon: Heading1 },
    { id: "h2", label: "Heading 2", icon: Heading2 },
    { id: "h3", label: "Heading 3", icon: Heading3 },
  ],
  [
    { id: "link", label: "Link", icon: Link2 },
    { id: "image", label: "Image", icon: Image },
    { id: "quote", label: "Quote", icon: Quote },
    { id: "bullet", label: "Bullet list", icon: List },
    { id: "ordered", label: "Numbered list", icon: ListOrdered },
    { id: "code", label: "Inline code", icon: Code },
    { id: "codeblock", label: "Code block", icon: SquareCode },
    { id: "divider", label: "Divider", icon: Minus },
  ],
];

interface Props {
  onCommand: (id: MarkdownCommandId) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  mode: EditorMode;
  onModeChange: (m: EditorMode) => void;
}

const btn =
  "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent";

export function EditorToolbar({
  onCommand,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  mode,
  onModeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
      <button className={btn} onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
        <Undo2 className="size-4" />
      </button>
      <button className={btn} onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
        <Redo2 className="size-4" />
      </button>
      {groups.map((g, i) => (
        <div key={i} className="flex items-center gap-0.5 border-l border-border pl-1">
          {g.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={btn}
              onClick={() => onCommand(id)}
              aria-label={label}
              title={label}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      ))}
      <div className="ml-auto flex rounded-md border border-border p-0.5 text-xs">
        {(["edit", "split", "preview"] as EditorMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={cn(
              "rounded px-2.5 py-1 capitalize text-muted-foreground",
              mode === m && "bg-secondary text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
