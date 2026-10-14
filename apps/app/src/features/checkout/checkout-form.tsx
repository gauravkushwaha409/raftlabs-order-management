import { FormInput, FormWrapper, useForm } from "@package/form";
import { Button } from "@package/ui";
import { type CheckoutValues, checkoutSchema } from "./checkout-schema";

interface CheckoutFormProps {
	onSubmit: (values: CheckoutValues) => void;
	isPending?: boolean;
	error?: string | null;
	/** Pre-fills the name field, e.g. with the signed-in user's name. */
	defaultName?: string;
}

export function CheckoutForm({
	onSubmit,
	isPending = false,
	error,
	defaultName = "",
}: CheckoutFormProps) {
	const form = useForm<CheckoutValues>({
		schema: checkoutSchema,
		defaultValues: { customerName: defaultName, address: "", phone: "" },
	});

	return (
		<FormWrapper
			useFormMethods={form}
			formProps={{
				className: "flex flex-col gap-4",
				onSubmit: form.handleSubmit(onSubmit),
			}}
		>
			<FormInput
				name="customerName"
				label="Full name"
				placeholder="Ada Lovelace"
				size="lg"
				inputProps={{ autoComplete: "name" }}
			/>
			<FormInput
				name="address"
				label="Delivery address"
				placeholder="12 Analytical Way, London"
				size="lg"
				inputProps={{ autoComplete: "street-address" }}
			/>
			<FormInput
				name="phone"
				label="Phone number"
				placeholder="+44 20 7946 0000"
				size="lg"
				inputProps={{ type: "tel", autoComplete: "tel" }}
			/>
			{error && (
				<p role="alert" className="typo-t3 text-alert-500">
					{error}
				</p>
			)}
			<Button
				type="submit"
				size="lg"
				isPending={isPending}
				pendingText="Placing order…"
			>
				Place order
			</Button>
		</FormWrapper>
	);
}
