import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./lib/main.js",
      name: "youloge.map",
      fileName: "youloge.map",
    },
  },
});
