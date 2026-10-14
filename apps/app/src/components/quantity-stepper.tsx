import { Button, cn } from "@package/ui";
import { MinusIcon, PlusIcon } from "lucide-react";
import { MAX_QUANTITY } from "@/stores/cart.store";

interface QuantityStepperProps {
	label: string;
	quantity: number;
	onChange: (quantity: number) => void;
	className?: string;
}

export function QuantityStepper({
	label,
	quantity,
	onChange,
	className,
}: QuantityStepperProps) {
	return (
		<fieldset className={cn("flex items-center gap-2", className)}>
			<legend className="sr-only">Quantity of {label}</legend>
			<Button
				variant="secondary"
				size="icon-xs"
				className="w-[34px]"
				aria-label={`Decrease quantity of ${label}`}
				icon={MinusIcon}
				onClick={() => onChange(quantity - 1)}
			/>
			<output
				aria-live="polite"
				className="min-w-6 text-center font-medium tabular-nums"
			>
				{quantity}
			</output>
			<Button
				variant="secondary"
				size="icon-xs"
				className="w-[34px]"
				aria-label={`Increase quantity of ${label}`}
				icon={PlusIcon}
				disabled={quantity >= MAX_QUANTITY}
				onClick={() => onChange(quantity + 1)}
			/>
		</fieldset>
	);
}
