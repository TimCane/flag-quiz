import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      include: ["packages/shared/src/**/*.ts", "packages/server/src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/index.ts",
        "**/collections/world.ts",
        "**/collections/us-states.ts",
        "**/collections/uk-counties.ts",
        "**/collections/types.ts",
      ],
    },
  },
});
