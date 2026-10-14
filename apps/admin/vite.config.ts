import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Env lives in ../../env (shared by every app); ${VAR} placeholders are expanded.
function expandEnv(value: string | undefined, env: Record<string, string>) {
	return value?.replace(/\$\{([^}]+)\}/g, (_, name: string) => env[name] ?? "");
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, "../../env", "");
	const port = Number.parseInt(env.ADMIN_PORT ?? "3001", 10);
	const serverUrl =
		expandEnv(env.VITE_SERVER_URL, env) ||
		`http://localhost:${env.SERVER_PORT ?? 8000}`;
	const proxy = env.PROXY === "true";

	return {
		envDir: "../../env",
		server: {
			port,
			host: true,
			...(proxy && {
				proxy: {
					"/api/v1": { target: serverUrl, changeOrigin: true },
					"/socket.io": { target: serverUrl, changeOrigin: true, ws: true },
				},
			}),
		},
		preview: { port, host: true, allowedHosts: true },
		plugins: [
			tanstackRouter({ target: "react", autoCodeSplitting: true }),
			react(),
			tailwindcss(),
		],
		define: {
			__PROXY_ENABLED__: proxy,
			__SERVER_URL__: JSON.stringify(serverUrl),
		},
		resolve: { tsconfigPaths: true },
	};
});
