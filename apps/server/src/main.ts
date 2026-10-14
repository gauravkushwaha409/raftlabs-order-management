import "reflect-metadata";
import * as path from "node:path";
import * as dotenv from "dotenv";

// cwd is apps/server under pnpm/turbo. Missing file (docker runtime) is a no-op;
// vars already set via docker env_file are never overridden.
dotenv.config({
	path: path.resolve(
		process.cwd(),
		`../../env/.env.${process.env.APP_ENV ?? "development"}`,
	),
	quiet: true,
});

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "./app.module.js";

/** Expand ${VAR} placeholders in env values (e.g. VITE_APP_URL=http://localhost:${APP_PORT}) */
function expandEnv(value?: string) {
	return value?.replace(
		/\$\{([^}]+)\}/g,
		(_, name: string) => process.env[name] ?? "",
	);
}

function getCorsOrigins() {
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

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: getCorsOrigins(),
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	});
	app.setGlobalPrefix("/api/v1");

	const config = new DocumentBuilder()
		.setTitle("Raftlabs Food API")
		.setDescription("Order management API")
		.setVersion("1.0")
		.build();
	SwaggerModule.setup(
		"api/v1/docs",
		app,
		cleanupOpenApiDoc(SwaggerModule.createDocument(app, config)),
	);

	const port = Number(process.env.SERVER_PORT ?? 8000);
	await app.listen(port, "0.0.0.0");
	console.log(`Server listening on http://localhost:${port}`);
}
await bootstrap();
