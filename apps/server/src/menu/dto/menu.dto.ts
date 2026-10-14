import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const menuItemFields = {
	name: z.string().trim().min(2, "Name is too short").max(100),
	description: z.string().trim().max(1000).default(""),
	priceCents: z.int().min(0, "Price cannot be negative").max(1_000_000),
	image: z.string().trim().max(500).default(""),
	category: z.string().trim().min(2, "Category is too short").max(50),
	available: z.boolean().default(true),
};

export const createMenuItemSchema = z.object(menuItemFields);

export const updateMenuItemSchema = z.object({
	name: menuItemFields.name.optional(),
	description: menuItemFields.description.optional(),
	priceCents: menuItemFields.priceCents.optional(),
	image: menuItemFields.image.optional(),
	category: menuItemFields.category.optional(),
	available: z.boolean().optional(),
});

export class CreateMenuItemDto extends createZodDto(createMenuItemSchema) {}
export class UpdateMenuItemDto extends createZodDto(updateMenuItemSchema) {}

export type CreateMenuItem = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItem = z.infer<typeof updateMenuItemSchema>;
