import "./env.js";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "./app.module.js";
import { configureApp } from "./app.setup.js";
import { ACCESS_COOKIE } from "./auth/types/auth.types.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	configureApp(app);
	app.enableShutdownHooks();

	const config = new DocumentBuilder()
		.setTitle("Raftlabs Food API")
		.setDescription("Accounts, menu, order placement and live order status")
		.setVersion("1.0")
		.addCookieAuth(ACCESS_COOKIE)
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
