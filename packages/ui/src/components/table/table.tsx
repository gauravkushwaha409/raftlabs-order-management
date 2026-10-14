import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	type HeaderGroup,
	type RowSelectionState,
	useReactTable,
} from "@tanstack/react-table";
import type React from "react";
import { useCallback } from "react";
import { cn } from "#lib/utils";

interface TableProps<T> {
	data: T[];
	columns: ColumnDef<T>[];
	getRowId?: (row: T, index: number) => string;
	getRowClassName?: (row: T) => string;
	tableWrapperProps?: React.ComponentProps<"div">;
	tableProps?: React.ComponentProps<"table">;
	theadProps?: React.ComponentProps<"thead">;
	tdProps?: React.ComponentProps<"td">;
	thProps?: React.ComponentProps<"td">;

	trHeaderProps?: React.ComponentProps<"tr">;
	trBodyProps?: React.ComponentProps<"tr">;

	// Loading state can be managed internally or passed as a prop
	isPending?: boolean;
	isError?: boolean;
	isSuccess?: boolean;
	/** Custom empty-state node rendered when the table has no rows. */
	emptyState?: React.ReactNode;

	// row selection
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: (
		newState: RowSelectionState,
		selectedRows: T[],
	) => void;
}

export function BaseTable<T>({
	data,
	columns,
	getRowId,
	getRowClassName,
	tableWrapperProps,
	tableProps,
	theadProps,
	tdProps,
	trBodyProps,
	trHeaderProps,
	thProps,
	// row selection props
	rowSelection,
	onRowSelectionChange,

	// Optional loading and error states
	isPending,
	isError,
	isSuccess = true,
	emptyState,
}: TableProps<T>) {
	const { className: tableWrapperClassName, ...restTableWrapperProps } =
		tableWrapperProps ?? {};
	const { className: tableClassName, ...restTableProps } = tableProps ?? {};
	const { className: theadClassName, ...restTHeadProps } = theadProps ?? {};
	const { className: tdClassName, ...restTdProps } = tdProps ?? {};
	const { className: trHeaderClassName, ...restTrHeaderProps } =
		trHeaderProps ?? {};
	const { className: trBodyClassName, ...restTrBodyProps } = trBodyProps ?? {};
	const { className: thClassName, ...restThProps } = thProps ?? {};

	const getRowIdentifier = useCallback(
		(row: T, index: number) => (getRowId ? getRowId(row, index) : String(index)),
		[getRowId],
	);

	// Internal row selection state
	const table = useReactTable<T>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...(getRowId ? { getRowId } : {}),
		enableRowSelection: !!rowSelection,
		enableMultiRowSelection: !!rowSelection,
		state: {
			rowSelection: rowSelection ?? {},
		},
		onRowSelectionChange: (updater) => {
			const newState =
				typeof updater === "function" ? updater(rowSelection ?? {}) : updater;
			const selectedRowIds = new Set(
				Object.entries(newState)
					.filter(([, isSelected]) => Boolean(isSelected))
					.map(([rowId]) => rowId),
			);
			const selectedRows = data.filter((row, index) =>
				selectedRowIds.has(getRowIdentifier(row, index)),
			);
			onRowSelectionChange?.(newState, selectedRows);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <restTrHeaderProps,restThProps are objects should not be dependencies>
	const renderHeader = useCallback(
		(headerGroup: HeaderGroup<T>) => (
			<tr
				key={headerGroup.id}
				className={cn("h-fit w-full shrink-0", trHeaderClassName)}
				{...restTrHeaderProps}
			>
				{headerGroup.headers.map((header) => (
					<th
						key={header.id}
						style={{
							width: header.column.getSize(),
							minWidth: header.column.columnDef.minSize,
							maxWidth: header.column.columnDef.maxSize,
						}}
						className={cn("shrink-0", thClassName)}
						{...restThProps}
					>
						{flexRender(header.column.columnDef.header, header.getContext())}
					</th>
				))}
			</tr>
		),
		[thClassName, trHeaderClassName],
	);

	return (
		<div
			className={cn("overflow-x-auto overflow-y-auto", tableWrapperClassName)}
			{...restTableWrapperProps}
		>
			<table
				className={cn(`w-full table-fixed relative `, tableClassName)}
				{...restTableProps}
			>
				<thead
					className={cn("sticky top-0 z-10", theadClassName)}
					{...restTHeadProps}
				>
					{table.getHeaderGroups().map(renderHeader)}
				</thead>

				{/* Successfully fetched - Records found */}
				{!isPending && !isError && isSuccess && data?.length > 0 && (
					<tbody>
						{table.getRowModel().rows.map((row) => {
							const isSelected = row.getIsSelected();
							return (
								<tr
									key={row.id}
									className={cn(
										"shrink-0 hover:bg-secondary",
										isSelected && "bg-web-primary-surface",
										getRowClassName?.(row.original),
										trBodyClassName,
									)}
									{...restTrBodyProps}
								>
									{row.getVisibleCells().map((cell) => (
										<td
											key={cell.id}
											style={{
												width: cell.column.getSize(),
												minWidth: cell.column.columnDef.minSize,
												maxWidth: cell.column.columnDef.maxSize,
											}}
											className={cn("shrink-0", tdClassName)}
											{...restTdProps}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									))}
								</tr>
							);
						})}
					</tbody>
				)}

				{/* Data fetching: Loading State */}
				{isPending && (
					<tbody>
						<tr>
							<td colSpan={columns.length} className="h-64 text-center align-middle">
								<div className="flex flex-col items-center justify-center p-8 space-y-3 text-muted-foreground">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
									<span className="text-sm font-medium">Loading data...</span>
								</div>
							</td>
						</tr>
					</tbody>
				)}

				{/* Error state */}
				{isError && !isPending && (
					<tbody>
						<tr>
							<td colSpan={columns.length} className="h-64 text-center align-middle">
								<div className="flex flex-col items-center justify-center p-8 space-y-3 text-destructive">
									<svg
										className="h-10 w-10 text-destructive/80"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<title>Error loading data</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1.5}
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
										/>
									</svg>
									<span className="text-sm font-medium text-destructive">
										An error occurred while loading data
									</span>
								</div>
							</td>
						</tr>
					</tbody>
				)}

				{/* Successfully fetched - No records found */}
				{!isPending && !isError && isSuccess && data?.length === 0 && (
					<tbody>
						<tr>
							<td
								colSpan={columns.length}
								className="max-h-64 text-center align-middle"
							>
								{emptyState ?? (
									<div className="flex flex-col items-center justify-center p-8 space-y-3 text-muted-foreground">
										<svg
											className="h-10 w-10 text-muted-foreground/50"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<title>No records found</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
											/>
										</svg>
										<span className="text-sm font-medium">No records found</span>
									</div>
								)}
							</td>
						</tr>
					</tbody>
				)}
			</table>
		</div>
	);
}
