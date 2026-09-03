/**
 * Test bootstrap — registers a Node import hook that resolves the
 * `server-only` marker package to a no-op. The npm `server-only`
 * package throws on import (it's a React Server Components compile-
 * time marker, not a runtime module). Tests run in plain Node, so
 * we short-circuit the import.
 *
 * Usage: `tsx --import ./src/__tests__/setup.mjs --test ...`
 */
import { register } from "node:module";

register("./loader.mjs", import.meta.url);
