import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";

import { applyMarkdownCommand, type MarkdownCommandId } from "@/core/content/markdown-commands";
import { getDemoDoc } from "@/core/content/demo-content";
import { getContentType } from "@/core/content-types/registry";
import { analyzeSEO } from "@/core/analyzers/seo";
import { analyzeWriting } from "@/core/analyzers/writing";
import { parseMarkdown } from "@/lib/markdown/markdown";
import type { ContentStatus, Metadata, MetadataValue } from "@/types/typecontent";

interface Snapshot {
  title: string;
  markdown: string;
}

const MAX_HISTORY = 100;

interface Draft extends Snapshot {
  metaDescription: string;
  focusKeyword: string;
  metadata: Metadata;
  status: ContentStatus;
}

const STATUSES: readonly ContentStatus[] = ["draft", "review", "published"];

function toStatus(value: MetadataValue | undefined): ContentStatus {
  return STATUSES.find((s) => s === value) ?? "draft";
}

export interface ContentEditorValue {
  title: string;
  markdown: string;
  metaDescription?: string;
  focusKeyword?: string;
  metadata?: Metadata;
}

export function useContentEditor(initialContentTypeId: string, initialValue?: ContentEditorValue) {
  const [contentTypeId, setContentTypeId] = useState(initialContentTypeId);
  const demo = getDemoDoc(initialContentTypeId);
  const initial = initialValue
    ? {
        title: initialValue.title,
        markdown: initialValue.markdown,
        metaDescription: initialValue.metaDescription ?? "",
        focusKeyword: initialValue.focusKeyword ?? "",
        metadata: initialValue.metadata ?? {},
      }
    : demo;

  const [title, setTitleState] = useState(initial.title);
  const [markdown, setMarkdownState] = useState(initial.markdown);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);
  const [focusKeyword, setFocusKeyword] = useState(initial.focusKeyword);
  const [metadata, setMetadata] = useState<Metadata>(initial.metadata);
  const [status, setStatus] = useState<ContentStatus>(toStatus(initial.metadata["status"]));

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

  /** Per-type drafts so switching types never overwrites another type's content. */
  const drafts = useRef<Map<string, Draft>>(new Map());

  const changeContentType = useCallback(
    (nextId: string) => {
      if (nextId === contentTypeId) return;
      drafts.current.set(contentTypeId, {
        title,
        markdown,
        metaDescription,
        focusKeyword,
        metadata,
        status,
      });
      const demo = getDemoDoc(nextId);
      const doc: Draft = drafts.current.get(nextId) ?? {
        ...demo,
        status: toStatus(demo.metadata["status"]),
      };
      setContentTypeId(nextId);
      setTitleState(doc.title);
      setMarkdownState(doc.markdown);
      setMetaDescription(doc.metaDescription);
      setFocusKeyword(doc.focusKeyword);
      setMetadata(doc.metadata);
      setStatus(doc.status);
      past.current = [];
      future.current = [];
      setHistoryVersion((v) => v + 1);
    },
    [contentTypeId, focusKeyword, markdown, metaDescription, metadata, status, title],
  );

  /** Commit a new markdown value (e.g. from a slash command) and place the caret. */
  const applyEdit = useCallback(
    (value: string, caret: number) => {
      commit({ markdown: value });
      lastTypedAt.current = 0;
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        el?.focus();
        el?.setSelectionRange(caret, caret);
      });
    },
    [commit],
  );

  const updateMetadata = useCallback((key: string, value: MetadataValue) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
    if (key === "status") setStatus(toStatus(value));
  }, []);
  const contentType = getContentType(contentTypeId);

  // Analysis runs on a deferred copy so typing stays responsive; the
  // canonical document is parsed once and shared by SEO and Writing.
  const deferredMarkdown = useDeferredValue(markdown);
  const document = useMemo(() => parseMarkdown(deferredMarkdown), [deferredMarkdown]);

  const seo = useMemo(
    () =>
      analyzeSEO({
        contentType,
        content: { title, markdown: deferredMarkdown },
        seo: { description: metaDescription, focusKeyword },
        metadata,
        document,
      }),
    [contentType, deferredMarkdown, document, focusKeyword, metaDescription, metadata, title],
  );

  const writing = useMemo(() => analyzeWriting({ contentType, document }), [contentType, document]);

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
    writing,
    document,
    runCommand,
    applyEdit,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historyVersion,
    textareaRef,
  };
}

export type ContentEditorController = ReturnType<typeof useContentEditor>;
