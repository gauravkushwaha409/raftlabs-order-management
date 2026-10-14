import type { RowSelectionState } from "@package/ui";
import { BaseTable, cn } from "@package/ui";

type BaseTableProps<T> = Pick<
	React.ComponentProps<typeof BaseTable<T>>,
	| "data"
	| "columns"
	| "getRowId"
	| "isPending"
	| "isError"
	| "emptyState"
	| "trBodyProps"
>;

interface TableProps<T> extends BaseTableProps<T> {
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: (newState: RowSelectionState) => void;
}

export function Table<T>({
	data,
	columns,
	getRowId,
	isPending,
	isError,
	emptyState,
	rowSelection,
	onRowSelectionChange,
	trBodyProps,
}: TableProps<T>) {
	const { className: trBodyClassName, ...restTrBodyProps } = trBodyProps ?? {};

	return (
		<BaseTable
			data={data}
			columns={columns}
			isPending={isPending ?? false}
			isError={isError ?? false}
			emptyState={emptyState}
			rowSelection={rowSelection}
			onRowSelectionChange={(newState) => onRowSelectionChange?.(newState)}
			{...(getRowId ? { getRowId } : {})}
			tableWrapperProps={{
				className:
					"rounded-[6px] border border-gray-200 overflow-x-auto overflow-y-auto scrollbar-none",
			}}
			theadProps={{ className: "bg-primary-50" }}
			thProps={{
				className:
					"px-4 py-2.5 text-left typo-t3 font-medium capitalize tracking-wide text-gray-950",
			}}
			trBodyProps={{
				className: cn(
					"border-b border-gray-200 last:border-0 hover:bg-gray-fill-50 transition-colors",
					trBodyClassName,
				),
				...restTrBodyProps,
			}}
			tdProps={{ className: "px-4 py-3 typo-t3 align-middle" }}
		/>
	);
}
