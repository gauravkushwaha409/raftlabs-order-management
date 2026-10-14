import { Button, Input, Label } from "@package/ui";
import { type FormEvent, useState } from "react";

interface LoginFormProps {
	onSubmit: (key: string) => void;
	isPending?: boolean;
	error?: string | null;
}

export function LoginForm({
	onSubmit,
	isPending = false,
	error,
}: LoginFormProps) {
	const [key, setKey] = useState("");
	const [touched, setTouched] = useState(false);
	const missing = touched && key.trim() === "";

	const submit = (event: FormEvent) => {
		event.preventDefault();
		setTouched(true);
		if (key.trim()) onSubmit(key.trim());
	};

	return (
		<form
			onSubmit={submit}
			className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-gray-border-200 p-6"
		>
			<h2 className="typo-h5 text-gray-800">Admin sign in</h2>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="admin-key" className="typo-t3 text-gray-600">
					Admin key
				</Label>
				<Input
					id="admin-key"
					type="password"
					autoComplete="current-password"
					value={key}
					aria-invalid={missing}
					onChange={(event) => setKey(event.target.value)}
				/>
				{missing && <p className="typo-t4 text-alert-500">Enter the admin key</p>}
			</div>
			{error && (
				<p role="alert" className="typo-t3 text-alert-500">
					{error}
				</p>
			)}
			<Button type="submit" isPending={isPending} pendingText="Checking…">
				Sign in
			</Button>
		</form>
	);
}
