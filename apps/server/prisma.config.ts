import * as path from "node:path";
import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// env/.env.<APP_ENV> (default development); already-set vars (docker env_file) win.
dotenv.config({
	path: path.resolve(
		import.meta.dirname,
		`../../env/.env.${process.env.APP_ENV ?? "development"}`,
	),
	quiet: true,
});

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: { path: "prisma/migrations" },
	datasource: { url: process.env.DATABASE_URL },
});
