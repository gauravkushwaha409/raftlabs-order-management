import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { getCorsOrigins } from "./common/cors.js";

/** HTTP setup shared by main.ts and the e2e tests, so tests exercise the real prefix, CORS and proxy rules. */
export function configureApp(app: INestApplication) {
	// Behind a reverse proxy set TRUST_PROXY=1 so rate limiting sees the client IP, not the proxy's.
	const trustProxy = process.env.TRUST_PROXY;
	if (trustProxy)
		(app as NestExpressApplication).set(
			"trust proxy",
			/^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy,
		);

	app.use(helmet({ contentSecurityPolicy: false })); // JSON API; CSP would only break the Swagger UI
	app.enableCors({
		origin: getCorsOrigins(),
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	});
	app.setGlobalPrefix("/api/v1");
}
