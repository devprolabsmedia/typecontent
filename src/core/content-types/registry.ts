import type { ContentTypeDefinition } from "@/types/typecontent";

/**
 * Content type registry.
 *
 * The editor never hard-codes behavior: the active content type provides
 * feature flags, metadata groups and SEO policy. Add a type here and the
 * whole playground adapts.
 */

const blog: ContentTypeDefinition = {
  id: "blog",
  slug: "blog",
  name: "Blog",
  description: "Long-form articles with authors, taxonomy and full SEO guidance.",
  icon: "newspaper",
  features: {
    seo: true,
    tags: true,
    categories: true,
    author: true,
    featuredImage: true,
    publishDate: true,
    excerpt: true,
  },
  metadataGroups: [
    {
      id: "publishing",
      label: "Publishing",
      fields: [
        {
          key: "status",
          label: "Status",
          kind: "select",
          feature: "publishDate",
          options: ["draft", "review", "published"],
        },
        { key: "author", label: "Author", kind: "text", feature: "author", placeholder: "Alex" },
        {
          key: "category",
          label: "Category",
          kind: "select",
          feature: "categories",
          options: ["Engineering", "Product", "Design", "Company"],
        },
        { key: "tags", label: "Tags", kind: "tags", feature: "tags" },
        { key: "publishDate", label: "Publish date", kind: "date", feature: "publishDate" },
        { key: "featuredImage", label: "Featured image", kind: "image", feature: "featuredImage" },
      ],
    },
    {
      id: "summary",
      label: "Summary",
      fields: [
        {
          key: "excerpt",
          label: "Excerpt",
          kind: "textarea",
          feature: "excerpt",
          placeholder: "One or two sentences used in listings.",
        },
      ],
    },
  ],
  seo: { enabled: true, titleRange: [30, 60], descriptionRange: [70, 160], minWords: 300 },
};

const page: ContentTypeDefinition = {
  id: "page",
  slug: "page",
  name: "Page",
  description: "Standalone marketing or legal pages addressed by slug.",
  icon: "file",
  features: { seo: true, slug: true, featuredImage: true },
  metadataGroups: [
    {
      id: "page",
      label: "Page",
      fields: [
        { key: "slug", label: "Slug", kind: "text", feature: "slug", placeholder: "about" },
        { key: "featuredImage", label: "Featured image", kind: "image", feature: "featuredImage" },
      ],
    },
  ],
  seo: { enabled: true, titleRange: [25, 60], descriptionRange: [70, 160], minWords: 150 },
};

const docs: ContentTypeDefinition = {
  id: "docs",
  slug: "docs",
  name: "Docs",
  description: "Versioned documentation with navigation and a table of contents.",
  icon: "book",
  features: { seo: true, tableOfContents: true, version: true, navigation: true },
  metadataGroups: [
    {
      id: "documentation",
      label: "Documentation",
      fields: [
        { key: "version", label: "Version", kind: "text", feature: "version", placeholder: "v1" },
        {
          key: "navigation",
          label: "Navigation",
          kind: "select",
          feature: "navigation",
          options: ["Auto", "Manual", "Hidden"],
        },
        {
          key: "tableOfContents",
          label: "Table of contents",
          kind: "switch",
          feature: "tableOfContents",
          hint: "Generated from H2 and H3 headings.",
        },
      ],
    },
  ],
  seo: { enabled: true, titleRange: [20, 60], descriptionRange: [60, 160], minWords: 200 },
};

const knowledgeBase: ContentTypeDefinition = {
  id: "knowledge-base",
  slug: "kb",
  name: "Knowledge Base",
  description: "Support answers grouped by category with related articles.",
  icon: "life-buoy",
  features: { seo: true, categories: true, tags: true, relatedArticles: true },
  metadataGroups: [
    {
      id: "help-center",
      label: "Help Center",
      fields: [
        {
          key: "category",
          label: "Category",
          kind: "select",
          feature: "categories",
          options: ["Getting Started", "Billing", "Editor", "Troubleshooting"],
        },
        { key: "tags", label: "Tags", kind: "tags", feature: "tags" },
        {
          key: "relatedArticles",
          label: "Related articles",
          kind: "tags",
          feature: "relatedArticles",
          hint: "Reference other articles by slug.",
        },
      ],
    },
  ],
  seo: { enabled: true, titleRange: [20, 60], descriptionRange: [60, 160], minWords: 120 },
};

const changelog: ContentTypeDefinition = {
  id: "changelog",
  slug: "changelog",
  name: "Changelog",
  description: "Release notes keyed by version and release date.",
  icon: "git-commit-horizontal",
  features: { version: true, releaseDate: true, tags: true },
  metadataGroups: [
    {
      id: "release",
      label: "Release",
      fields: [
        {
          key: "version",
          label: "Version",
          kind: "text",
          feature: "version",
          placeholder: "v2.4.0",
        },
        { key: "releaseDate", label: "Release date", kind: "date", feature: "releaseDate" },
        { key: "tags", label: "Tags", kind: "tags", feature: "tags" },
      ],
    },
  ],
  seo: { enabled: false, titleRange: [10, 60], descriptionRange: [50, 160], minWords: 60 },
};

const course: ContentTypeDefinition = {
  id: "course",
  slug: "course",
  name: "Course",
  description: "Structured lessons with difficulty and duration metadata.",
  icon: "graduation-cap",
  features: { seo: true, lessons: true, courseMeta: true, difficulty: true, duration: true },
  metadataGroups: [
    {
      id: "course",
      label: "Course",
      fields: [
        {
          key: "difficulty",
          label: "Difficulty",
          kind: "select",
          feature: "difficulty",
          options: ["Beginner", "Intermediate", "Advanced"],
        },
        {
          key: "duration",
          label: "Duration (minutes)",
          kind: "number",
          feature: "duration",
          placeholder: "180",
        },
        { key: "lessons", label: "Lessons", kind: "tags", feature: "lessons" },
        {
          key: "instructor",
          label: "Instructor",
          kind: "text",
          feature: "courseMeta",
          placeholder: "Alex",
        },
      ],
    },
  ],
  seo: { enabled: true, titleRange: [25, 60], descriptionRange: [70, 160], minWords: 250 },
};

export const contentTypes: ContentTypeDefinition[] = [
  blog,
  page,
  docs,
  knowledgeBase,
  changelog,
  course,
];

export { blog, page, docs, knowledgeBase, changelog, course };

/** Built-ins plus any user-defined types registered at runtime. */
export const contentTypeRegistry: Record<string, ContentTypeDefinition> = Object.fromEntries(
  contentTypes.map((t) => [t.id, t]),
);

export function getContentType(id: string): ContentTypeDefinition {
  return contentTypeRegistry[id] ?? blog;
}

export function hasContentType(id: string): boolean {
  return id in contentTypeRegistry;
}

/** Register a custom content type (e.g. "case-study") without touching the editor. */
export function registerContentType(type: ContentTypeDefinition): ContentTypeDefinition {
  contentTypeRegistry[type.id] = type;
  return type;
}

export function listContentTypes(): ContentTypeDefinition[] {
  return Object.values(contentTypeRegistry);
}

export interface DefineContentTypeInput {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  features?: ContentTypeDefinition["features"];
  metadataGroups?: ContentTypeDefinition["metadataGroups"];
  seo?: Partial<ContentTypeDefinition["seo"]>;
}

/** Build a complete ContentTypeDefinition with sensible defaults. Pure — does not register. */
export function defineContentType(input: DefineContentTypeInput): ContentTypeDefinition {
  const features = input.features ?? {};
  return {
    id: input.id,
    slug: input.id,
    name: input.name,
    description: input.description ?? "",
    icon: input.icon ?? "file-text",
    features,
    metadataGroups: input.metadataGroups ?? [],
    seo: {
      enabled: features.seo ?? false,
      titleRange: [30, 60],
      descriptionRange: [70, 160],
      minWords: 150,
      ...input.seo,
    },
  };
}

export function hasFeature(type: ContentTypeDefinition, feature: string): boolean {
  return Boolean(type.features[feature as keyof typeof type.features]);
}

export const featureLabels: Record<string, string> = {
  seo: "SEO",
  tags: "Tags",
  categories: "Categories",
  author: "Author",
  featuredImage: "Featured image",
  publishDate: "Publish date",
  excerpt: "Excerpt",
  slug: "Slug",
  tableOfContents: "Table of contents",
  version: "Version",
  navigation: "Navigation",
  relatedArticles: "Related articles",
  releaseDate: "Release date",
  lessons: "Lessons",
  courseMeta: "Course metadata",
  difficulty: "Difficulty",
  duration: "Duration",
};
