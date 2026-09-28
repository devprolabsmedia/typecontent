import type { BlockDefinition } from "@/core/blocks/registry";
import { cn } from "@/lib/utils";

interface Props {
  commands: BlockDefinition[];
  active: number;
  top: number;
  left: number;
  onSelect: (block: BlockDefinition) => void;
}

/** Compact command menu anchored near the caret. */
export function SlashCommandMenu({ commands, active, top, left, onSelect }: Props) {
  return (
    <div
      role="listbox"
      aria-label="Insert block"
      className="absolute z-20 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
      style={{ top: top + 24, left }}
    >
      <p className="label-xs border-b border-border px-3 py-1.5 text-muted-foreground">
        Insert block
      </p>
      <ul className="max-h-64 overflow-y-auto p-1">
        {commands.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">No matching block</li>
        )}
        {commands.map((block, i) => (
          <li key={block.type}>
            <button
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(block);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm",
                i === active ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {block.name}
              <span className="font-mono text-[10px] text-muted-foreground/70">{block.type}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
