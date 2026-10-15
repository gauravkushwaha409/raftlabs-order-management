import { CheckIcon, XIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
	return (
		<Sonner
			position="top-right"
			expand
			className="toaster group "
			icons={{
				success: (
					<div className="size-6 flex items-center justify-center rounded-[6px] text-white-base bg-success-600">
						<CheckIcon size={14} />
					</div>
				),
				close: <XIcon size={20} className="text-gray-500" />,
			}}
			toastOptions={{
				unstyled: true,
				classNames: {
					toast:
						"group pointer-events-auto  flex w-fit max-w-[530px]! min-w-[320px] items-start gap-2.5  overflow-hidden rounded-[12px] border border-gray-200  p-4  shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),_0_4px_6px_-2px_rgba(16,24,40,0.03)]",
					title: "typo-t3 font-semibold text-gray-800",
					description: "typo-t4 text-gray-500",
					closeButton: "bg-transparent! cursor-pointer order-last size-5! ml-auto",
					default: "bg-white-base! border-gray-200!",
					success: "bg-white-base! border-gray-200! ",
					...toastOptions?.classNames,
				},
				...toastOptions,
			}}
			closeButton
			{...props}
		/>
	);
};

export { Toaster };
