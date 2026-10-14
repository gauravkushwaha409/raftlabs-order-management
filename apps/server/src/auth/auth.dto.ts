import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const email = z
	.string()
	.trim()
	.toLowerCase()
	.max(254)
	.pipe(z.email("Enter a valid email"));

export const registerSchema = z.object({
	name: z.string().trim().min(2, "Name is too short").max(100),
	email,
	password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
	email,
	password: z.string().min(1, "Enter your password").max(128),
});

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
