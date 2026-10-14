import { z } from "zod";

// Mirrors the API rules so most mistakes are caught before a request is made.
const email = z
	.string()
	.trim()
	.toLowerCase()
	.max(254)
	.pipe(z.email("Enter a valid email"));

export const loginSchema = z.object({
	email,
	password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
	name: z.string().trim().min(2, "Enter your name").max(100, "Name is too long"),
	email,
	password: z
		.string()
		.min(8, "Use at least 8 characters")
		.max(128, "Password is too long"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
