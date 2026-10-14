import * as path from "node:path";
import * as dotenv from "dotenv";

// Side-effect module: must be the first import of main.ts so env is loaded before
// any decorator (e.g. gateway CORS) reads process.env. cwd is apps/server under pnpm/turbo.
// Missing file (docker runtime) is a no-op; already-set vars are never overridden.
dotenv.config({
	path: path.resolve(
		process.cwd(),
		`../../env/.env.${process.env.APP_ENV ?? "development"}`,
	),
	quiet: true,
});
