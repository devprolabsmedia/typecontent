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
  | "duration"
  | "instructor";

export type ContentFeatures = Partial<Record<ContentFeature, boolean>>;

export type MetadataFieldKind =
  | "text"
  | "textarea"
  | "select"
  | "multiselect"
  | "tags"
  | "date"
  | "switch"
  | "image"
  | "number"
  /** Planned: reference to other content by id/slug. Rendered as a tag list for now. */
  | "relation"
  /** Structured list of child items, e.g. course lessons. */
  | "collection";

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
    /** Which SEO rules run for this type. One analyzer, configurable rules. */
    rules: SEORuleId[];
  };
  /** Writing rule set (separate from SEO). Falls back to a default set. */
  writing?: import("@/core/analyzers/writing").WritingConfig;
}

/* ---------- Lessons (structured child content of a Course) ---------- */

export type LessonStatus = "draft" | "published";

/**
 * A lesson is child content, not a metadata string. Designed so a future
 * ContentAdapter can persist Course -> CourseLesson -> Lesson content and so
 * a lesson body can later be edited with the same ContentEditor.
 * Planned extensions: kind (video/article/quiz/assignment/resource), locked,
 * prerequisites, completion state.
 */
export interface Lesson {
  id: string;
  title: string;
  slug?: string | undefined;
  description?: string | undefined;
  /** Minutes */
  duration?: number | undefined;
  /** 1-based position inside the course */
  order: number;
  status?: LessonStatus | undefined;
}

export type MetadataValue = string | number | boolean | string[] | Lesson[] | null;

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

/* ---------- SEO ---------- */

/** SEO metadata lives apart from content-type metadata. */
export interface SEOData {
  /** Overrides the content title in search results. Falls back to the title. */
  title?: string;
  description?: string;
  focusKeyword?: string;
  /** Planned in the UI */
  canonicalUrl?: string;
  /** Planned in the UI */
  noIndex?: boolean;
  /** Planned in the UI */
  ogImage?: string;
}

export type SEOStatus = "pass" | "warning" | "error" | "info";

export type SEOCategory = "basic" | "content" | "links" | "media" | "readability" | "structure";

export type SEORuleId =
  | "title"
  | "titleLength"
  | "metaDescription"
  | "metaDescriptionLength"
  | "slug"
  | "headingStructure"
  | "headingHierarchy"
  | "toc"
  | "contentLength"
  | "keyword"
  | "keywordInTitle"
  | "keywordInIntro"
  | "internalLinks"
  | "externalLinks"
  | "emptyLinks"
  | "imageAlt"
  | "paragraphLength"
  | "sentenceLength"
  | "relatedContent"
  | "releaseInfo"
  | "courseDescription"
  | "lessonCount"
  | "lessonTitles"
  | "lessonOrder";

export interface SEOCheck {
  id: SEORuleId;
  label: string;
  category: SEOCategory;
  status: SEOStatus;
  /** One-line result, e.g. "Your title is 72 characters." */
  message: string;
  /** What it means / why it matters / what to do. */
  details?: string;
  weight: number;
}

export interface SEOResult {
  /** Editorial SEO quality score 0-100. Not a ranking prediction. */
  score: number;
  checks: SEOCheck[];
  /** Categories present in this result, in rule order. */
  categories: SEOCategory[];
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
