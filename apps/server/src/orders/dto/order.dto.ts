import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { OrderStatus } from "../constant/order-status.js";

const statusSchema = z.enum(
	Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]],
);

export const createOrderSchema = z.object({
	customerName: z.string().trim().min(2, "Name is too short").max(100),
	address: z.string().trim().min(5, "Address is too short").max(300),
	phone: z
		.string()
		.trim()
		.regex(/^\+?[0-9\s()-]{7,20}$/, "Invalid phone number"),
	items: z
		.array(z.object({ menuItemId: z.uuid(), quantity: z.int().min(1).max(20) }))
		.min(1, "Add at least one item")
		.max(50)
		.refine(
			(items) =>
				new Set(items.map((item) => item.menuItemId)).size === items.length,
			{
				message: "Duplicate menu items; combine them into one line with a quantity",
			},
		),
});

export const updateOrderStatusSchema = z.object({ status: statusSchema });

export const listOrdersQuerySchema = z.object({
	status: statusSchema.optional(),
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

export class CreateOrderDto extends createZodDto(createOrderSchema) {}
export class UpdateOrderStatusDto extends createZodDto(
	updateOrderStatusSchema,
) {}
export class ListOrdersQueryDto extends createZodDto(listOrdersQuerySchema) {}
