import type {
  Content,
  ContentAdapter,
  ContentQuery,
  CreateContentInput,
  UpdateContentInput,
} from "@/types/typecontent";

/**
 * Reference in-memory adapter.
 *
 * It exists to prove the ContentAdapter contract; D1, Supabase, Postgres or a
 * REST backend can be dropped in later without touching the editor.
 */
export function createMemoryAdapter(seed: Content[] = []): ContentAdapter {
  const store = new Map<string, Content>(seed.map((item) => [item.id, item]));
  const now = () => new Date().toISOString();

  return {
    async create(input: CreateContentInput) {
      const content: Content = {
        id: crypto.randomUUID(),
        contentTypeId: input.contentTypeId,
        title: input.title,
        markdown: input.markdown,
        status: input.status ?? "draft",
        metadata: input.metadata ?? {},
        createdAt: now(),
        updatedAt: now(),
        publishedAt: null,
      };
      store.set(content.id, content);
      return content;
    },
    async get(id: string) {
      return store.get(id) ?? null;
    },
    async update(id: string, input: UpdateContentInput) {
      const existing = store.get(id);
      if (!existing) throw new Error(`Content ${id} not found`);
      const next: Content = { ...existing, ...input, updatedAt: now() };
      store.set(id, next);
      return next;
    },
    async delete(id: string) {
      store.delete(id);
    },
    async list(query: ContentQuery = {}) {
      let items = [...store.values()];
      if (query.contentTypeId) items = items.filter((i) => i.contentTypeId === query.contentTypeId);
      if (query.status) items = items.filter((i) => i.status === query.status);
      if (query.search) {
        const term = query.search.toLowerCase();
        items = items.filter(
          (i) => i.title.toLowerCase().includes(term) || i.markdown.toLowerCase().includes(term),
        );
      }
      const offset = query.offset ?? 0;
      return items.slice(offset, offset + (query.limit ?? items.length));
    },
    async publish(id: string) {
      const existing = store.get(id);
      if (!existing) throw new Error(`Content ${id} not found`);
      const next: Content = {
        ...existing,
        status: "published",
        publishedAt: now(),
        updatedAt: now(),
      };
      store.set(id, next);
      return next;
    },
    async unpublish(id: string) {
      const existing = store.get(id);
      if (!existing) throw new Error(`Content ${id} not found`);
      const next: Content = {
        ...existing,
        status: "draft",
        publishedAt: null,
        updatedAt: now(),
      };
      store.set(id, next);
      return next;
    },
  };
}
