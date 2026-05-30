import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 'base' relativo ("./") faz os assets carregarem certo no GitHub Pages,
// tanto em usuario.github.io quanto em usuario.github.io/repo/.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
