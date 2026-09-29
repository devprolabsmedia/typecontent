import type { ContentTypeDefinition } from "@/types/typecontent";

const exportNames: Record<string, string> = {
  blog: "blog",
  page: "page",
  docs: "docs",
  "knowledge-base": "knowledgeBase",
  changelog: "changelog",
  course: "course",
};

/** Integration snippet tailored to the selected content type. Same editor, different config. */
export function integrationExample(type: ContentTypeDefinition): string {
  const name = exportNames[type.id] ?? "myType";
  const comp = `${type.name.replace(/[^A-Za-z]/g, "")}Editor`;
  const notes: string[] = [];
  if (type.seo.enabled) notes.push("// SEO analyzer runs live in the side panel");
  if (type.features.tableOfContents || type.features.navigation)
    notes.push("// Table of contents / navigation come from the content type's metadata");
  if (type.features.version) notes.push("// Version + release date fields are enabled");
  if (type.features.lessons) notes.push("// Lessons + course metadata are enabled");
  return `import { useState } from "react";
import { ContentEditor } from "@typecontent/editor";
import { ${name} } from "@typecontent/content-types";

export function ${comp}() {
  const [content, setContent] = useState({ title: "", markdown: "" });
  ${notes.join("\n  ")}
  return (
    <ContentEditor
      contentType={${name}}
      value={content}
      onChange={setContent}
      showTypeSwitcher={false}
    />
  );
}`;
}

export const customTypeExample = `import { defineContentType } from "@typecontent/content-types";
import { ContentEditor } from "@typecontent/editor";

const caseStudy = defineContentType({
  id: "case-study",
  name: "Case Study",
  features: { seo: true, featuredImage: true, author: true, publishDate: true },
  metadataGroups: [
    {
      id: "project",
      label: "Project",
      fields: [
        { key: "client", label: "Client", kind: "text", feature: "author" },
        { key: "industry", label: "Industry", kind: "text", feature: "author" },
      ],
    },
  ],
});

<ContentEditor contentType={caseStudy} showTypeSwitcher={false} />`;
