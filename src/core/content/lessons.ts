import { slugify } from "@/lib/markdown/markdown";
import type { Lesson, MetadataValue } from "@/types/typecontent";

/** Pure lesson list operations. Always return a new list with order = 1..n. */

export function isLessonList(value: MetadataValue | undefined): value is Lesson[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "object" && v !== null && "id" in v && "title" in v)
  );
}

export function normalizeLessons(list: Lesson[]): Lesson[] {
  return list.map((l, i) => ({ ...l, order: i + 1 }));
}

let counter = 0;
export function createLesson(partial: Partial<Lesson> = {}): Lesson {
  counter += 1;
  const title = partial.title ?? "";
  return {
    id: partial.id ?? `lesson-${Date.now().toString(36)}-${counter}`,
    title,
    slug: partial.slug ?? (title ? slugify(title) : undefined),
    description: partial.description,
    duration: partial.duration,
    order: partial.order ?? 0,
    status: partial.status ?? "draft",
  };
}

export function addLesson(list: Lesson[], lesson: Lesson = createLesson()): Lesson[] {
  return normalizeLessons([...list, lesson]);
}

export function updateLesson(list: Lesson[], id: string, patch: Partial<Lesson>): Lesson[] {
  return list.map((l) => (l.id === id ? { ...l, ...patch, id: l.id, order: l.order } : l));
}

export function removeLesson(list: Lesson[], id: string): Lesson[] {
  return normalizeLessons(list.filter((l) => l.id !== id));
}

export function moveLesson(list: Lesson[], id: string, delta: -1 | 1): Lesson[] {
  const i = list.findIndex((l) => l.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(i, 1);
  if (item) next.splice(j, 0, item);
  return normalizeLessons(next);
}

export function totalDuration(list: Lesson[]): number {
  return list.reduce((sum, l) => sum + (l.duration ?? 0), 0);
}
