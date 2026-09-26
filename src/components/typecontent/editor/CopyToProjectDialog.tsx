import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SITE } from "@/core/content/site";

function Snippet({ label, code }: { label: string; code: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-1">
      <div className="label-xs">{label}</div>
      <div className="relative rounded-md border border-border bg-background">
        <pre className="overflow-x-auto p-3 pr-10 font-mono text-xs leading-relaxed">{code}</pre>
        <button
          aria-label={`Copy ${label}`}
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(code);
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

export function CopyToProjectDialog({ contentTypeId, title, markdown }: { contentTypeId: string; title: string; markdown: string }) {
  const usage = `import { ContentEditor } from "${SITE.packageName}";

export function Editor() {
  return <ContentEditor contentType="${contentTypeId}" />;
}`;
  const json = JSON.stringify({ contentTypeId, title, markdown: markdown.slice(0, 160) + (markdown.length > 160 ? "…" : "") }, null, 2);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Copy to Project</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add this editor to your project</DialogTitle>
          <DialogDescription>Install the package, drop in the component, and pick a content type.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Snippet label="Install" code={`bun add ${SITE.packageName}`} />
          <Snippet label="Usage" code={usage} />
          <Snippet label="Current document" code={json} />
          <Snippet label="Full Markdown" code={markdown} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
