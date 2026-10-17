// Builds the static GitHub Pages demo into ./out (see next.config.ts).
//
// A static export can't contain Route Handlers, and the real ones (PDF
// generation, tenant payments, owner provisioning) need the Admin SDK, so
// app/api is moved aside for the duration of the build and always restored —
// even on failure or Ctrl+C.
//
//   npm run build:demo                      -> served from /AmlakMS (GitHub Pages project site)
//   BASE_PATH= npm run build:demo           -> served from the domain root
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(root, "app", "api");
const parkedApiDir = join(root, ".demo-parked-api");
const outDir = join(root, "out");

const basePath = process.env.BASE_PATH ?? "/AmlakMS";

if (existsSync(parkedApiDir)) {
  console.error(`${parkedApiDir} already exists — a previous demo build was interrupted.`);
  console.error("Move it back to app/api (or delete it if app/api is intact) and re-run.");
  process.exit(1);
}

let parked = false;
function restore() {
  if (parked) {
    renameSync(parkedApiDir, apiDir);
    parked = false;
  }
}
process.on("SIGINT", () => {
  restore();
  process.exit(130);
});

let status = 1;
try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, parkedApiDir);
    parked = true;
  }
  rmSync(outDir, { recursive: true, force: true });

  const result = spawnSync("npx", ["next", "build"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NEXT_PUBLIC_DEMO: "true", NEXT_PUBLIC_BASE_PATH: basePath },
  });
  status = result.status ?? 1;

  if (status === 0) {
    // next.config.ts sets distDir to ".next-demo"; with `output: "export"` Next
    // writes the static site there instead of ./out, so copy it across.
    const exported = join(root, ".next-demo");
    if (!existsSync(join(exported, "index.html"))) {
      console.error(`Static export not found at ${exported} (no index.html).`);
      status = 1;
      throw new Error("missing static export");
    }
    mkdirSync(outDir, { recursive: true });
    cpSync(exported, outDir, { recursive: true });
    // Belt and braces — the Actions deploy doesn't run Jekyll, but a branch-based
    // Pages setup would, and Jekyll ignores the _next directory.
    writeFileSync(join(outDir, ".nojekyll"), "");
    // GitHub Pages serves 404.html for unknown paths.
    const notFound = join(outDir, "404", "index.html");
    if (existsSync(notFound)) copyFileSync(notFound, join(outDir, "404.html"));
    console.log(`\nDemo built into ${outDir} (base path "${basePath || "/"}")`);
  }
} finally {
  restore();
}
process.exit(status);
