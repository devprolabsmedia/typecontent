#!/usr/bin/env node
/**
 * TypeContent CLI (prototype, not yet published).
 * Run from a checkout: `bun packages/cli/src/cli.ts add editor --cwd ../my-app`
 *
 * All decisions (parsing, resolution, overwrite planning) live in the pure
 * registry module; this file only does deterministic file I/O. Registry
 * entries are data — nothing from them is executed.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  collectDependencies,
  collectFiles,
  componentRegistry,
  detectProject,
  generateConfig,
  parseCliArgs,
  planCopy,
} from "../../../src/core/distribution/registry";

const REPO = resolve(dirname(new URL(import.meta.url).pathname), "../../..");
const argv = process.argv.slice(2);
const cwdIdx = argv.indexOf("--cwd");
const target = resolve(cwdIdx >= 0 ? (argv[cwdIdx + 1] ?? ".") : ".");
const cmd = parseCliArgs(argv.filter((_, i) => i !== cwdIdx && i !== cwdIdx + 1));

function readPkg() {
  const p = join(target, "package.json");
  if (!existsSync(p)) throw new Error(`No package.json in ${target}`);
  return JSON.parse(readFileSync(p, "utf8"));
}

switch (cmd.kind) {
  case "help":
    console.log("typecontent <init|add <component...>|list> [--force] [--cwd <dir>]");
    break;
  case "error":
    console.error(cmd.message);
    process.exit(1);
  // eslint-disable-next-line no-fallthrough
  case "list":
    for (const e of Object.values(componentRegistry)) console.log(`${e.id.padEnd(14)} ${e.description}`);
    break;
  case "init": {
    const info = detectProject(readPkg(), readdirSync(target));
    console.log("Detected:", info);
    const cfg = join(target, "typecontent.config.ts");
    if (existsSync(cfg) && !cmd.force) console.log("typecontent.config.ts exists — skipped (use --force).");
    else writeFileSync(cfg, generateConfig());
    mkdirSync(join(target, "src/components/typecontent"), { recursive: true });
    console.log("Next: typecontent add editor");
    break;
  }
  case "add": {
    const files = collectFiles(cmd.components);
    const existing = new Set(files.filter((f) => existsSync(join(target, f))));
    const { write, skip } = planCopy(files, existing, cmd.force);
    for (const f of write) {
      mkdirSync(dirname(join(target, f)), { recursive: true });
      copyFileSync(join(REPO, f), join(target, f));
      console.log("  + " + f);
    }
    for (const f of skip) console.log("  = " + f + " (exists, skipped)");
    const deps = collectDependencies(cmd.components);
    if (deps.length) console.log(`\nInstall dependencies: npm install ${deps.join(" ")}`);
    console.log("Imports use the @/ alias — map it to ./src in your tsconfig.");
    break;
  }
}
