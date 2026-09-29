# typecontent (CLI)

**Status: prototype in this repo — not published to npm. `npx typecontent` does not work yet.**

Commands: `init`, `add <editor|seo|blocks|content-types|markdown|core>`, `list`, flags `--force`, `--cwd`.

Run from a checkout:

```sh
bun packages/cli/src/cli.ts init --cwd ../my-app
bun packages/cli/src/cli.ts add editor --cwd ../my-app
```

Behavior: detects package manager/TypeScript/React/framework, writes `typecontent.config.ts`, copies source listed in the component registry (`src/core/distribution/registry.ts`), never overwrites existing files without `--force`, prints dependencies to install. Registry entries are data only — nothing is executed.
