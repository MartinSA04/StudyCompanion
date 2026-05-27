/**
 * Dev-harness setup. The framework serves its own demo course (content/), whose
 * injected routes import "study-companion/pages/…" — so the package *name* must
 * resolve to this repo. Real course repos get that for free (they install the
 * framework into their node_modules); here we self-link node_modules/study-companion
 * back to the repo root.
 *
 * Idempotent; chained into the `dev`/`build` scripts so it survives a fresh
 * `pnpm install`. Never runs in consumer repos (they don't invoke our scripts).
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = join(root, "node_modules");
const link = join(nodeModules, "study-companion");

if (!existsSync(nodeModules)) mkdirSync(nodeModules, { recursive: true });

let linked = false;
try {
  linked = lstatSync(link).isSymbolicLink() && readlinkSync(link) === root;
} catch {
  /* not present */
}

if (!linked) {
  try {
    rmSync(link, { recursive: true, force: true });
  } catch {
    /* nothing to remove */
  }
  symlinkSync(root, link, "dir");
  console.log(
    "[study-companion] self-linked node_modules/study-companion → repo root (demo harness)",
  );
}
