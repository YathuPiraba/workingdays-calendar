import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
      insertTypesEntry: true,
      rollupTypes: true,
      include: ["src"],
      exclude: [
        "src/App.tsx",
        "src/App.css",
        "src/main.tsx",
        "src/index.css",
        "src/mockEvents.ts",
        "src/vite-env.d.ts",
      ],
    }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactWorkingDaysCalendar",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.esm.js" : "index.cjs.js"),
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    emptyOutDir: true,
    outDir: "dist",
    cssCodeSplit: false,
    sourcemap: true,
  },
});
