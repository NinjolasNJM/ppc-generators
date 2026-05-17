import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@genroot": path.resolve(__dirname, "src"),
    },
  },
});
