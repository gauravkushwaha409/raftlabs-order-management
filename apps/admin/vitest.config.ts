import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: { tsconfigPaths: true },
	define: {
		__PROXY_ENABLED__: true,
		__SERVER_URL__: JSON.stringify("http://localhost:8000"),
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test-setup.ts"],
		include: ["src/**/*.{spec,test}.{ts,tsx}"],
	},
});
