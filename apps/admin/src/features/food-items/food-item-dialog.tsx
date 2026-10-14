import {
	FormCheckbox,
	FormInput,
	FormTextarea,
	FormWrapper,
	useForm,
} from "@package/form";
import { Button, DialogWrapper } from "@package/ui";
import { z } from "zod";
import type { MenuItem, MenuItemInput } from "@/types/api";

const CATEGORIES = [
	"Pizza",
	"Burgers",
	"Sides",
	"Salads",
	"Pasta",
	"Dessert",
	"Drinks",
];

const foodItemSchema = z.object({
	name: z.string().trim().min(2, "Name is too short").max(100),
	description: z.string().trim().max(1000),
	priceDollars: z
		.string()
		.trim()
		.regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price (e.g. 12.99)"),
	image: z.string().trim().max(500),
	category: z.string().trim().min(2, "Category is too short").max(50),
	available: z.boolean(),
});

type FoodItemValues = z.infer<typeof foodItemSchema>;

interface FoodItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: MenuItem | null;
	isPending?: boolean;
	onSubmit: (values: MenuItemInput) => void;
}

const toValues = (item: MenuItem | null): FoodItemValues => ({
	name: item?.name ?? "",
	description: item?.description ?? "",
	priceDollars: item ? (item.priceCents / 100).toFixed(2) : "",
	image: item?.image ?? "",
	category: item?.category ?? "",
	available: item?.available ?? true,
});

export function FoodItemDialog({
	open,
	onOpenChange,
	item,
	isPending = false,
	onSubmit,
}: FoodItemDialogProps) {
	const form = useForm<FoodItemValues>({
		schema: foodItemSchema,
		defaultValues: toValues(item),
		values: toValues(item),
	});

	const handleSubmit = (values: FoodItemValues) => {
		onSubmit({
			name: values.name.trim(),
			description: values.description.trim(),
			priceCents: Math.round(Number.parseFloat(values.priceDollars) * 100),
			image: values.image.trim(),
			category: values.category.trim(),
			available: values.available,
		});
	};

	return (
		<DialogWrapper
			open={open}
			onOpenChange={onOpenChange}
			size="md"
			title={item ? "Edit food item" : "Add food item"}
			description={
				item
					? `Update ${item.name}. Changes apply to the customer menu immediately.`
					: "Add a new item to the customer menu."
			}
			footer={
				<>
					<Button
						type="button"
						variant="secondary"
						className="w-auto"
						disabled={isPending}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={isPending}
						isPending={isPending}
						pendingText="Saving…"
						onClick={() => void form.handleSubmit(handleSubmit)()}
					>
						{item ? "Save changes" : "Add item"}
					</Button>
				</>
			}
		>
			<FormWrapper
				useFormMethods={form}
				formProps={{
					className: "flex flex-col gap-4",
					onSubmit: form.handleSubmit(handleSubmit),
				}}
			>
				<FormInput
					name="name"
					label="Name"
					inputProps={{ placeholder: "Margherita Pizza" }}
				/>
				<FormTextarea
					name="description"
					label="Description"
					placeholder="Classic tomato, mozzarella and basil"
				/>
				<div className="grid grid-cols-2 gap-4">
					<FormInput
						name="priceDollars"
						label="Price (USD)"
						inputProps={{ placeholder: "12.99", inputMode: "decimal" }}
					/>
					<FormInput
						name="category"
						label="Category"
						inputProps={{ placeholder: "Pizza", list: "food-item-categories" }}
					/>
				</div>
				<datalist id="food-item-categories">
					{CATEGORIES.map((category) => (
						<option key={category} value={category} />
					))}
				</datalist>
				<FormInput
					name="image"
					label="Image URL"
					inputProps={{ placeholder: "https://…", type: "url" }}
				/>
				<FormCheckbox name="available" label="Available for ordering" />
			</FormWrapper>
		</DialogWrapper>
	);
}
