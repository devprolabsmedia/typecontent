import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SITE } from "@/core/content/site";
import { componentRegistry, resolveComponents } from "@/core/distribution/registry";
import { integrationExample } from "@/core/distribution/examples";
import { cn } from "@/lib/utils";
import type { ContentTypeDefinition } from "@/types/typecontent";

export function Snippet({ label, code }: { label?: string; code: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-1">
      {label && <div className="label-xs">{label}</div>}
      <div className="relative rounded-md border border-border bg-background">
        <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed">{code}</pre>
        <button
          aria-label={`Copy ${label ?? "code"}`}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            void navigator.clipboard?.writeText(code);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
        >
          {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}

const YOU_GET = [
  "Unified editor",
  "Markdown support",
  "Preview",
  "Content types",
  "SEO analyzer",
  "Extensible blocks",
  "TypeScript types",
  "Framework-friendly architecture",
  "No hosted service required",
];

type Path = "cli" | "packages" | "source";

export function sourceTree(): string {
  const files = resolveComponents(["editor"]).flatMap((e) => e.files);
  return files.map((f) => f.replace(/^src\//, "")).join("\n");
}

export function CopyToProjectDialog({ contentType }: { contentType: ContentTypeDefinition }) {
  const [path, setPath] = useState<Path>("cli");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Copy to Project</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add TypeContent to your project</DialogTitle>
          <DialogDescription>
            TypeContent is open source. Copy the editor into your project and own the code.
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Install path"
          className="flex gap-1 rounded-lg border border-border p-1 text-sm"
        >
          {(
            [
              ["cli", "Add with CLI"],
              ["packages", "Install packages"],
              ["source", "Copy source"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={path === id}
              onClick={() => setPath(id)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground",
                path === id && "bg-secondary text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4" role="tabpanel">
          {path === "cli" && (
            <>
              <p className="text-xs text-muted-foreground">
                <span className="rounded border border-border px-1.5 py-0.5 font-mono">
                  Coming with the CLI package
                </span>{" "}
                The intended workflow. The CLI is not published to npm yet.
              </p>
              <Snippet label="Initialize" code="npx typecontent init" />
              <Snippet label="Add the editor" code="npx typecontent add editor" />
              <Snippet
                label="Optional"
                code={"npx typecontent add seo\nnpx typecontent add blocks"}
              />
            </>
          )}
          {path === "packages" && (
            <>
              <p className="text-xs text-muted-foreground">
                <span className="rounded border border-border px-1.5 py-0.5 font-mono">
                  Planned
                </span>{" "}
                Package names are reserved in the architecture but not published to npm yet.
              </p>
              <Snippet label="Install" code="npm install @typecontent/editor @typecontent/core" />
              <Snippet
                label="Optional"
                code={"npm install @typecontent/seo\nnpm install @typecontent/blocks"}
              />
            </>
          )}
          {path === "source" && (
            <>
              <p className="text-xs text-muted-foreground">
                Copy these files from the{" "}
                <a
                  href={SITE.githubUrl}
                  className="text-primary underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  repository
                </a>{" "}
                into your app. They're plain React + TypeScript with no backend.
              </p>
              <Snippet label="Files" code={sourceTree()} />
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {resolveComponents(["editor"]).map((e) => (
                  <li key={e.id}>
                    <span className="font-mono text-foreground">{componentRegistry[e.id].id}</span>{" "}
                    — {e.description}
                  </li>
                ))}
              </ul>
            </>
          )}

          <Snippet label={`Usage — ${contentType.name}`} code={integrationExample(contentType)} />

          <div>
            <div className="label-xs mb-2">You get</div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
              {YOU_GET.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Open source · License: TBD · {SITE.version}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
