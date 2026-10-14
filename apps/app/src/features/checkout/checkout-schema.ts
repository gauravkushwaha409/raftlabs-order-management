import { z } from "zod";

// Mirrors the API rules so most mistakes are caught before a request is made.
export const checkoutSchema = z.object({
	customerName: z
		.string()
		.trim()
		.min(2, "Enter your full name")
		.max(100, "Name is too long"),
	address: z
		.string()
		.trim()
		.min(5, "Enter your delivery address")
		.max(300, "Address is too long"),
	phone: z
		.string()
		.trim()
		.regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
