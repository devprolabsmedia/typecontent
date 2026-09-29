/**
 * Component registry: the single source of truth for what TypeContent
 * distributes. Used by the Copy to Project dialog, the docs and the CLI.
 *
 * Entries are plain data — the CLI never executes code from a registry entry.
 */

export type ComponentId = "core" | "markdown" | "blocks" | "seo" | "content-types" | "editor";

export interface RegistryEntry {
  id: ComponentId;
  /** Conceptual package name, e.g. "@typecontent/seo". Not yet published. */
  packageName: string;
  description: string;
  /** Other registry entries this one needs. Directional, no cycles. */
  registryDependencies: ComponentId[];
  /** npm dependencies the copied source needs. */
  dependencies: string[];
  /** Source files relative to the TypeContent repository root. */
  files: string[];
}

export const componentRegistry: Record<ComponentId, RegistryEntry> = {
  core: {
    id: "core",
    packageName: "@typecontent/core",
    description: "Content model, domain types, adapter interfaces and an in-memory adapter.",
    registryDependencies: [],
    dependencies: [],
    files: ["src/types/typecontent.ts", "src/core/content/memory-adapter.ts"],
  },
  markdown: {
    id: "markdown",
    packageName: "@typecontent/markdown",
    description: "Dependency-free Markdown parser, serializer and editing commands.",
    registryDependencies: [],
    dependencies: [],
    files: ["src/lib/markdown/markdown.ts", "src/core/content/markdown-commands.ts"],
  },
  blocks: {
    id: "blocks",
    packageName: "@typecontent/blocks",
    description: "Block registry, built-in blocks and the callout custom block.",
    registryDependencies: ["markdown"],
    dependencies: [],
    files: ["src/core/blocks/registry.ts"],
  },
  seo: {
    id: "seo",
    packageName: "@typecontent/seo",
    description: "Deterministic SEO analyzer — no AI, no network.",
    registryDependencies: ["core", "markdown"],
    dependencies: [],
    files: ["src/core/analyzers/seo.ts"],
  },
  "content-types": {
    id: "content-types",
    packageName: "@typecontent/content-types",
    description: "Blog, Page, Docs, Knowledge Base, Changelog, Course and defineContentType().",
    registryDependencies: ["core"],
    dependencies: [],
    files: ["src/core/content-types/registry.ts"],
  },
  editor: {
    id: "editor",
    packageName: "@typecontent/editor",
    description: "ContentEditor, toolbar, preview, slash commands, SEO and metadata panels.",
    registryDependencies: ["core", "markdown", "blocks", "seo", "content-types"],
    dependencies: ["react", "lucide-react", "clsx", "tailwind-merge"],
    files: [
      "src/components/typecontent/editor/ContentEditor.tsx",
      "src/components/typecontent/editor/useContentEditor.ts",
      "src/components/typecontent/editor/EditorToolbar.tsx",
      "src/components/typecontent/editor/DocumentRenderer.tsx",
      "src/components/typecontent/editor/SlashCommandMenu.tsx",
      "src/components/typecontent/editor/useSlashCommands.ts",
      "src/components/typecontent/editor/SEOPanel.tsx",
      "src/components/typecontent/editor/MetadataPanel.tsx",
      "src/core/content/demo-content.ts",
    ],
  },
};

export const componentIds = Object.keys(componentRegistry) as ComponentId[];

export function isComponentId(value: string): value is ComponentId {
  return value in componentRegistry;
}

/** Resolve entries plus their registry dependencies, dependencies first, no duplicates. */
export function resolveComponents(ids: ComponentId[]): RegistryEntry[] {
  const seen = new Set<ComponentId>();
  const out: RegistryEntry[] = [];
  const visit = (id: ComponentId, stack: ComponentId[]) => {
    if (seen.has(id)) return;
    if (stack.includes(id)) throw new Error(`Registry cycle: ${[...stack, id].join(" → ")}`);
    const entry = componentRegistry[id];
    for (const dep of entry.registryDependencies) visit(dep, [...stack, id]);
    seen.add(id);
    out.push(entry);
  };
  for (const id of ids) visit(id, []);
  return out;
}

export function collectFiles(ids: ComponentId[]): string[] {
  return [...new Set(resolveComponents(ids).flatMap((e) => e.files))];
}

export function collectDependencies(ids: ComponentId[]): string[] {
  return [...new Set(resolveComponents(ids).flatMap((e) => e.dependencies))].sort();
}

/* ---------- Config ---------- */

export interface TypeContentConfig {
  componentsDir: string;
  contentTypesDir: string;
  blocksDir: string;
}

export const defaultConfig: TypeContentConfig = {
  componentsDir: "./src/components/typecontent",
  contentTypesDir: "./src/content-types",
  blocksDir: "./src/components/typecontent/blocks",
};

export function generateConfig(overrides: Partial<TypeContentConfig> = {}): string {
  const c = { ...defaultConfig, ...overrides };
  return `export default {
  componentsDir: ${JSON.stringify(c.componentsDir)},
  contentTypesDir: ${JSON.stringify(c.contentTypesDir)},
  blocksDir: ${JSON.stringify(c.blocksDir)},
};
`;
}

/* ---------- Project detection (pure: operates on package.json data) ---------- */

export interface ProjectInfo {
  packageManager: "bun" | "pnpm" | "yarn" | "npm";
  typescript: boolean;
  react: boolean;
  framework: "next" | "vite" | "unknown";
}

export function detectProject(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  lockfiles: string[],
): ProjectInfo {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const has = (n: string) => n in deps;
  const packageManager = lockfiles.some((f) => f.startsWith("bun.lock"))
    ? "bun"
    : lockfiles.includes("pnpm-lock.yaml")
      ? "pnpm"
      : lockfiles.includes("yarn.lock")
        ? "yarn"
        : "npm";
  return {
    packageManager,
    typescript: has("typescript"),
    react: has("react"),
    framework: has("next") ? "next" : has("vite") ? "vite" : "unknown",
  };
}

/* ---------- CLI parsing ---------- */

export type CliCommand =
  | { kind: "init"; force: boolean }
  | { kind: "add"; components: ComponentId[]; force: boolean }
  | { kind: "list" }
  | { kind: "help" }
  | { kind: "error"; message: string };

export function parseCliArgs(argv: string[]): CliCommand {
  const force = argv.includes("--force");
  const args = argv.filter((a) => !a.startsWith("--"));
  const [cmd, ...rest] = args;
  if (!cmd || cmd === "help") return { kind: "help" };
  if (cmd === "init") return { kind: "init", force };
  if (cmd === "list") return { kind: "list" };
  if (cmd === "add") {
    if (rest.length === 0)
      return { kind: "error", message: "Specify a component, e.g. `add editor`." };
    const unknown = rest.filter((r) => !isComponentId(r));
    if (unknown.length)
      return { kind: "error", message: `Unknown component: ${unknown.join(", ")}` };
    return { kind: "add", components: rest as ComponentId[], force };
  }
  return { kind: "error", message: `Unknown command: ${cmd}` };
}

/** Decide file operations without touching disk: never overwrite unless forced. */
export function planCopy(
  files: string[],
  existing: Set<string>,
  force: boolean,
): { write: string[]; skip: string[] } {
  const write: string[] = [];
  const skip: string[] = [];
  for (const f of files) (existing.has(f) && !force ? skip : write).push(f);
  return { write, skip };
}
