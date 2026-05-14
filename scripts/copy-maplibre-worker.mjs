import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = require.resolve("maplibre-gl/dist/maplibre-gl-csp-worker.js");
const target = join(process.cwd(), "public", "maplibre-gl-csp-worker.js");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

