// A production SPA build, without Cloudflare bindings or development proxies.
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: { dedupe: ["react", "react-dom", "react-router"] },
  define: {
    "import.meta.env.VITE_LOCAL_SERVICE_TOKEN": JSON.stringify(""),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(""),
    "import.meta.env.VITE_REPLIT_PRODUCTION": JSON.stringify("true"),
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  build: { sourcemap: false },
});
