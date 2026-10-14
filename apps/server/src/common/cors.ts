/** Expand ${VAR} placeholders in env values (e.g. VITE_APP_URL=http://localhost:${APP_PORT}) */
function expandEnv(value?: string) {
	return value?.replace(
		/\$\{([^}]+)\}/g,
		(_, name: string) => process.env[name] ?? "",
	);
}

export function getCorsOrigins() {
	const origins = new Set<string>([
		`http://localhost:${process.env.APP_PORT ?? 3000}`,
		`http://localhost:${process.env.ADMIN_PORT ?? 3001}`,
	]);
	for (const url of [
		expandEnv(process.env.VITE_APP_URL),
		expandEnv(process.env.VITE_ADMIN_URL),
	]) {
		if (url) origins.add(new URL(url).origin);
	}
	for (const origin of process.env.CORS_ORIGINS?.split(",") ?? []) {
		if (origin.trim()) origins.add(origin.trim());
	}
	return [...origins];
}
