import { useCallback, useMemo, useRef, useState } from "react";

import {
  applyMarkdownCommand,
  type MarkdownCommandId,
} from "@/core/content/markdown-commands";
import { getDemoDoc } from "@/core/content/demo-content";
import { getContentType } from "@/core/content-types/registry";
import { analyzeSEO } from "@/core/analyzers/seo";
import type { ContentStatus, Metadata, MetadataValue } from "@/types/typecontent";

interface Snapshot {
  title: string;
  markdown: string;
}

const MAX_HISTORY = 100;

export function useContentEditor(initialContentTypeId: string) {
  const [contentTypeId, setContentTypeId] = useState(initialContentTypeId);
  const initial = getDemoDoc(initialContentTypeId);

  const [title, setTitleState] = useState(initial.title);
  const [markdown, setMarkdownState] = useState(initial.markdown);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [focusKeyword, setFocusKeyword] = useState(initial.focusKeyword);
  const [metadata, setMetadata] = useState<Metadata>(initial.metadata);
  const [status, setStatus] = useState<ContentStatus>("draft");

  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const pushHistory = useCallback((snapshot: Snapshot) => {
    past.current = [...past.current.slice(-MAX_HISTORY), snapshot];
    future.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const commit = useCallback(
    (next: Partial<Snapshot>) => {
      pushHistory({ title, markdown });
      if (next.title !== undefined) setTitleState(next.title);
      if (next.markdown !== undefined) setMarkdownState(next.markdown);
    },
    [markdown, pushHistory, title],
  );

  const lastTypedAt = useRef(0);

  /** Coalesce fast keystrokes into one history entry. */
  const setMarkdown = useCallback(
    (value: string) => {
      const now = Date.now();
      if (now - lastTypedAt.current > 600) pushHistory({ title, markdown });
      lastTypedAt.current = now;
      setMarkdownState(value);
    },
    [markdown, pushHistory, title],
  );

  const setTitle = useCallback(
    (value: string) => {
      const now = Date.now();
      if (now - lastTypedAt.current > 600) pushHistory({ title, markdown });
      lastTypedAt.current = now;
      setTitleState(value);
    },
    [markdown, pushHistory, title],
  );

  const undo = useCallback(() => {
    const previous = past.current.at(-1);
    if (!previous) return;
    past.current = past.current.slice(0, -1);
    future.current = [...future.current, { title, markdown }];
    setTitleState(previous.title);
    setMarkdownState(previous.markdown);
    setHistoryVersion((v) => v + 1);
  }, [markdown, title]);

  const redo = useCallback(() => {
    const next = future.current.at(-1);
    if (!next) return;
    future.current = future.current.slice(0, -1);
    past.current = [...past.current, { title, markdown }];
    setTitleState(next.title);
    setMarkdownState(next.markdown);
    setHistoryVersion((v) => v + 1);
  }, [markdown, title]);

  const runCommand = useCallback(
    (id: MarkdownCommandId) => {
      const el = textareaRef.current;
      const start = el?.selectionStart ?? markdown.length;
      const end = el?.selectionEnd ?? markdown.length;
      const result = applyMarkdownCommand(id, { value: markdown, start, end });
      commit({ markdown: result.value });
      lastTypedAt.current = 0;
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(result.start, result.end);
      });
    },
    [commit, markdown],
  );

  const changeContentType = useCallback((nextId: string) => {
    const doc = getDemoDoc(nextId);
    setContentTypeId(nextId);
    setTitleState(doc.title);
    setMarkdownState(doc.markdown);
    setMetaDescription(doc.metaDescription);
    setFocusKeyword(doc.focusKeyword);
    setMetadata(doc.metadata);
    setStatus((doc.metadata.status as ContentStatus) ?? "draft");
    past.current = [];
    future.current = [];
    setHistoryVersion((v) => v + 1);
  }, []);

  const updateMetadata = useCallback((key: string, value: MetadataValue) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
    if (key === "status" && typeof value === "string") setStatus(value as ContentStatus);
  }, []);

  const contentType = getContentType(contentTypeId);

  const seo = useMemo(
    () => analyzeSEO({ title, markdown, metaDescription, focusKeyword }, contentType),
    [contentType, focusKeyword, markdown, metaDescription, title],
  );

  return {
    contentType,
    contentTypeId,
    changeContentType,
    title,
    setTitle,
    markdown,
    setMarkdown,
    metaDescription,
    setMetaDescription,
    focusKeyword,
    setFocusKeyword,
    metadata,
    updateMetadata,
    status,
    setStatus,
    seo,
    runCommand,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyVersion,
    textareaRef,
  };
}

export type ContentEditorController = ReturnType<typeof useContentEditor>;
