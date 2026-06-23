import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      phaser: path.resolve(__dirname, "src/__mocks__/phaser.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
