import { Button } from "@package/ui";

export function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4">
			<h1 className="text-2xl font-semibold">Raftlabs Food</h1>
			<Button>Ready</Button>
		</main>
	);
}
