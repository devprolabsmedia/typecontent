/**
 * Core TypeContent domain types.
 * These are UI-agnostic and safe to run in any TypeScript runtime
 * (browser, Node, Cloudflare Workers).
 */

export type EditorMode = "edit" | "preview" | "split";

export type ContentStatus = "draft" | "review" | "published";

export type ContentFeature =
  | "seo"
  | "tags"
  | "categories"
  | "author"
  | "featuredImage"
  | "publishDate"
  | "excerpt"
  | "slug"
  | "tableOfContents"
  | "version"
  | "navigation"
  | "relatedArticles"
  | "releaseDate"
  | "lessons"
  | "courseMeta"
  | "difficulty"
  | "duration";

export type ContentFeatures = Partial<Record<ContentFeature, boolean>>;

export type MetadataFieldKind =
  "text" | "textarea" | "select" | "tags" | "date" | "switch" | "image" | "number";

export interface MetadataFieldDef {
  /** Key inside Content.metadata */
  key: string;
  label: string;
  kind: MetadataFieldKind;
  /** Which feature flag gates this field */
  feature: ContentFeature;
  placeholder?: string;
  options?: string[];
  hint?: string;
}

export interface MetadataGroupDef {
  id: string;
  /** Group heading shown in the metadata panel, e.g. "Publishing" */
  label: string;
  fields: MetadataFieldDef[];
}

export interface ContentTypeDefinition {
  id: string;
  name: string;
  description: string;
  /** Short technical hint, e.g. "blog" */
  slug: string;
  icon: string;
  features: ContentFeatures;
  metadataGroups: MetadataGroupDef[];
  seo: {
    enabled: boolean;
    /** Recommended title length range */
    titleRange: [number, number];
    descriptionRange: [number, number];
    minWords: number;
  };
}

export type MetadataValue = string | number | boolean | string[] | null;

export type Metadata = Record<string, MetadataValue>;

export interface Content {
  id: string;
  contentTypeId: string;
  title: string;
  /** Markdown is the canonical representation. */
  markdown: string;
  status: ContentStatus;
  metadata: Metadata;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export type SEOStatus = "pass" | "warning" | "fail" | "info";

export interface SEOCheck {
  id: string;
  label: string;
  status: SEOStatus;
  /** Short explanation revealed when the check is expanded. */
  detail: string;
  weight: number;
}

export interface SEOResult {
  score: number;
  checks: SEOCheck[];
  stats: ContentStats;
}

export interface ContentStats {
  words: number;
  characters: number;
  readingMinutes: number;
  headings: { level: number; text: string }[];
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesMissingAlt: number;
  codeBlocks: number;
}

/* ---------- Adapter-ready persistence contracts (no implementation here) ---------- */

export interface CreateContentInput {
  contentTypeId: string;
  title: string;
  markdown: string;
  metadata?: Metadata;
  status?: ContentStatus;
}

export type UpdateContentInput = Partial<
  Pick<Content, "title" | "markdown" | "metadata" | "status">
>;

export interface ContentQuery {
  contentTypeId?: string;
  status?: ContentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ContentAdapter {
  create(input: CreateContentInput): Promise<Content>;
  get(id: string): Promise<Content | null>;
  update(id: string, input: UpdateContentInput): Promise<Content>;
  delete(id: string): Promise<void>;
  list(query?: ContentQuery): Promise<Content[]>;
  publish(id: string): Promise<Content>;
  unpublish(id: string): Promise<Content>;
}
