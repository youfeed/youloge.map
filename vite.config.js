import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./lib/main.js",
      name: "youloge.map",
      fileName: "youloge.map",
    },
  },
  optimizeDeps: {
    exclude: ["fsevents"], // 确保 fsevents 不被 Vite 尝试优化/预构建
  },
});
