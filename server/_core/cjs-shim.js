// CJS shim for esbuild ESM output
// Provides __dirname, __filename, require for CommonJS interop
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

export { __filename, __dirname, require };
