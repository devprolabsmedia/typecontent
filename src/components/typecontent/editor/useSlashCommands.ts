import { useCallback, useMemo, useState } from "react";

import { listBlocks, type BlockDefinition } from "@/core/blocks/registry";

/**
 * Slash command interaction for the markdown editor.
 *
 * Typing "/" at the start of a line opens a filtered command menu near the
 * caret; Enter applies the block template, Escape closes, arrows navigate.
 */

export interface SlashState {
  open: boolean;
  query: string;
  /** Index in the markdown string where the "/" lives. */
  slashIndex: number;
  /** Highlighted command index. */
  active: number;
  /** Caret position relative to the textarea, for menu placement. */
  top: number;
  left: number;
}

const CLOSED: SlashState = { open: false, query: "", slashIndex: 0, active: 0, top: 0, left: 0 };

/** Pixel position of a caret inside a textarea, via a mirrored div. */
export function getCaretCoordinates(
  el: HTMLTextAreaElement,
  position: number,
): { top: number; left: number } {
  const mirror = document.createElement("div");
  const style = getComputedStyle(el);
  for (const prop of [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderLeftWidth",
    "boxSizing",
    "whiteSpace",
    "wordWrap",
    "width",
  ]) {
    mirror.style.setProperty(
      prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()),
      style.getPropertyValue(prop.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())),
    );
  }
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.textContent = el.value.slice(0, position);
  const marker = document.createElement("span");
  marker.textContent = "​";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const rect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  document.body.removeChild(mirror);
  return {
    top: rect.top - mirrorRect.top - el.scrollTop,
    left: rect.left - mirrorRect.left - el.scrollLeft,
  };
}

/** Detect an active "/query" trigger ending at the caret. */
export function detectSlash(
  value: string,
  caret: number,
): { query: string; slashIndex: number } | null {
  const lineStart = value.lastIndexOf("\n", caret - 1) + 1;
  const before = value.slice(lineStart, caret);
  const match = before.match(/^\/(\w*)$/);
  if (!match) return null;
  return { query: match[1] ?? "", slashIndex: lineStart };
}

export function filterBlocks(query: string): BlockDefinition[] {
  const q = query.toLowerCase();
  const all = listBlocks().filter((b) => b.template !== "" || b.type === "paragraph");
  if (!q) return all;
  return all.filter(
    (b) => b.name.toLowerCase().includes(q) || b.keywords.some((k) => k.includes(q)),
  );
}

export function useSlashCommands(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  applyEdit: (value: string, caret: number) => void,
) {
  const [slash, setSlash] = useState<SlashState>(CLOSED);

  const close = useCallback(() => setSlash(CLOSED), []);

  /** Call on every markdown change / caret move to refresh the trigger. */
  const sync = useCallback(
    (value: string, caret: number) => {
      const el = textareaRef.current;
      const hit = detectSlash(value, caret);
      if (!hit || !el) {
        setSlash((s) => (s.open ? CLOSED : s));
        return;
      }
      const { top, left } = getCaretCoordinates(el, caret);
      setSlash((s) => ({
        open: true,
        query: hit.query,
        slashIndex: hit.slashIndex,
        active: s.open && s.slashIndex === hit.slashIndex ? s.active : 0,
        top,
        left,
      }));
    },
    [textareaRef],
  );

  const commands = useMemo(() => filterBlocks(slash.query), [slash.query]);

  const apply = useCallback(
    (block: BlockDefinition) => {
      const el = textareaRef.current;
      if (!el) return;
      const caret = el.selectionStart;
      const value = el.value;
      const next = value.slice(0, slash.slashIndex) + block.template + value.slice(caret);
      const nextCaret = slash.slashIndex + (block.caretOffset ?? block.template.length);
      setSlash(CLOSED);
      applyEdit(next, nextCaret);
    },
    [applyEdit, slash.slashIndex, textareaRef],
  );

  /**
   * Keydown handler for the textarea while the menu is open.
   * Returns true when the key was consumed.
   */
  const handleKey = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!slash.open) return false;
      if (e.key === "ArrowDown") {
        setSlash((s) => ({ ...s, active: (s.active + 1) % Math.max(1, commands.length) }));
        return true;
      }
      if (e.key === "ArrowUp") {
        setSlash((s) => ({
          ...s,
          active: (s.active - 1 + Math.max(1, commands.length)) % Math.max(1, commands.length),
        }));
        return true;
      }
      if (e.key === "Enter") {
        const block = commands[slash.active] ?? commands[0];
        if (block) apply(block);
        return true;
      }
      if (e.key === "Escape") {
        close();
        return true;
      }
      return false;
    },
    [apply, close, commands, slash.active, slash.open],
  );

  return { slash, commands, sync, apply, close, handleKey };
}
