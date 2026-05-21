import { defineConfig } from "vitest/config";

// Scoped to the pure logic under lib/. No jsdom — these are DOM-free modules,
// so the node environment keeps the suite fast. UI tests, if ever added, would
// opt into a jsdom environment per-file.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
