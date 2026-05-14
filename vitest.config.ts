import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["client/src/**/*.test.{ts,tsx}", "shared/**/*.test.{ts,tsx}"],
  },
});
