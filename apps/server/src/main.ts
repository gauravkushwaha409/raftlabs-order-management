import "./env.js";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "./app.module.js";
import { getCorsOrigins } from "./common/cors.js";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(helmet({ contentSecurityPolicy: false })); // JSON API; CSP would only break the Swagger UI
	app.enableCors({
		origin: getCorsOrigins(),
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	});
	app.setGlobalPrefix("/api/v1");
	app.enableShutdownHooks();

	const config = new DocumentBuilder()
		.setTitle("Raftlabs Food API")
		.setDescription("Menu, order placement and live order status")
		.setVersion("1.0")
		.addApiKey({ type: "apiKey", name: "x-admin-key", in: "header" }, "admin-key")
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
