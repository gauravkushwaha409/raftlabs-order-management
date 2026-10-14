import type React from "react";
import type { ElementType, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

// ─── Token map ────────────────────────────────────────────────────────────────

const tokens = {
	d1: {
		tag: "h1",
		classes: "text-[36px] font-bold leading-[1.25] tracking-[-0.01em]",
	},
	d2: {
		tag: "h1",
		classes: "text-[30px] font-bold leading-[1.30] tracking-[-0.01em]",
	},
	h1: {
		tag: "h1",
		classes: "text-[28px] font-bold leading-[1.4] tracking-[-0.01em]",
	},
	h2: {
		tag: "h2",
		classes: "text-[26px] font-bold leading-[1.5]  tracking-[-0.01em]",
	},
	h3: {
		tag: "h3",
		classes: "text-[24px] font-bold leading-[1.5] tracking-[-0.01em]",
	},
	h4: {
		tag: "h4",
		classes: "text-[22px] font-bold leading-[1.5]  tracking-[-0.01em]",
	},
	h5: {
		tag: "h5",
		classes: "text-[20px] font-medium leading-[1.5] tracking-[-0.01em]",
	},
	h6: {
		tag: "h6",
		classes: "text-[18px] font-medium leading-[1.5]  tracking-[-0.01em]",
	},
	t1: {
		tag: "p",
		classes: "text-[16px] font-normal leading-[1.5] ",
	},
	t2: {
		tag: "p",
		classes: "text-[15px] font-normal leading-[1.45]",
	},
	t3: {
		tag: "p",
		classes: "text-[14px] font-normal leading-[1.45]",
	},
	t4: {
		tag: "p",
		classes: "text-[13px] font-normal leading-[1.4]",
	},
	t5: {
		tag: "span",
		classes: "text-[12px] font-normal leading-[1.5] tracking-[0.01em]",
	},
	t6: {
		tag: "span",
		classes: "text-[11px] font-normal leading-[1.45]  tracking-[0.01em]",
	},
	cap: {
		tag: "span",
		classes: "text-[10px] font-normal leading-[1.45]",
	},
} as const;

type VariantKey = keyof typeof tokens;

// ─── Font-weight → Tailwind class map ────────────────────────────────────────

const weightMap = {
	regular: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
} as const;

export type FontWeight = keyof typeof weightMap;

// ─── Minimal cn() ─────────────────────────────────────────────────────────────
// Already using clsx / tailwind-merge? Swap this out:
//   import { cn } from '@/lib/utils';

function cn(...inputs: (string | undefined | null | false)[]) {
	return twMerge(inputs.filter(Boolean).join(" "));
}

// ─── Shared props ─────────────────────────────────────────────────────────────

interface TypographyProps extends HTMLAttributes<HTMLElement> {
	/** Override the default semantic tag */
	as?: ElementType;
	/**
   * Override the variant's default font-weight with a numeric value.
   * Mapped internally to the correct Tailwind utility class.
   *
   *   weight="regular" → font-normal
   *   weight="medium" → font-medium
   *   weight="semibold" → font-semibold
   *   weight="bold" → font-bold

   */
	weight?: FontWeight;
	children?: React.ReactNode;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createVariant(variant: VariantKey) {
	const { tag, classes } = tokens[variant];

	const Component = ({
		as,
		weight,
		className,
		children,
		...rest
	}: TypographyProps) => {
		const Tag = (as ?? tag) as ElementType;
		// Merge order: base tokens → weight override → consumer className (wins last)
		const composedClass = cn(classes, weight && weightMap[weight], className);
		return (
			<Tag className={composedClass} {...rest}>
				{children}
			</Tag>
		);
	};

	Component.displayName = `Typography.${variant.toUpperCase()}`;
	return Component;
}

// ─── Typography namespace ─────────────────────────────────────────────────────

export const Typography = {
	// Display
	D1: createVariant("d1"),
	D2: createVariant("d2"),
	// Heading
	H1: createVariant("h1"),
	H2: createVariant("h2"),
	H3: createVariant("h3"),
	H4: createVariant("h4"),
	H5: createVariant("h5"),
	H6: createVariant("h6"),
	// Text
	T1: createVariant("t1"),
	T2: createVariant("t2"),
	T3: createVariant("t3"),
	T4: createVariant("t4"),
	T5: createVariant("t5"),
	T6: createVariant("t6"),
	// Caption
	Cap: createVariant("cap"),
};

export default Typography;
