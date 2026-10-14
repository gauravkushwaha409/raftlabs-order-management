import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { getOrder } from "@/lib/api";
import type { Order } from "@/types/api";
import { useOrderStatus } from "./use-order-status";

vi.mock("@/lib/api", () => ({
	getOrder: vi.fn(),
	orderEventsUrl: (id: string) => `/api/v1/orders/${id}/events`,
}));

class FakeEventSource {
	static instances: FakeEventSource[] = [];
	onopen: (() => void) | null = null;
	onerror: (() => void) | null = null;
	closed = false;
	private listeners = new Map<string, (event: MessageEvent<string>) => void>();

	readonly url: string;

	constructor(url: string) {
		this.url = url;
		FakeEventSource.instances.push(this);
	}
	addEventListener(
		type: string,
		listener: (event: MessageEvent<string>) => void,
	) {
		this.listeners.set(type, listener);
	}
	close() {
		this.closed = true;
	}
	emit(order: Order) {
		this.listeners.get("order")?.({
			data: JSON.stringify(order),
		} as MessageEvent<string>);
	}
}

const order = (status: Order["status"]): Order => ({
	id: "6b0c2d8e-0000-4000-8000-000000000000",
	customerName: "Ada",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
	status,
	totalCents: 1000,
	items: [],
	createdAt: "2026-10-14T10:00:00.000Z",
	updatedAt: "2026-10-14T10:00:00.000Z",
});

// One client per test so the cache survives re-renders but never leaks between tests.
const createWrapper = () => {
	const client = new QueryClient();
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
};

describe("useOrderStatus", () => {
	beforeEach(() => {
		FakeEventSource.instances = [];
		vi.stubGlobal("EventSource", FakeEventSource);
		vi.mocked(getOrder).mockResolvedValue(order("RECEIVED"));
	});
	afterEach(() => vi.unstubAllGlobals());

	it("loads the order, then applies live updates from the stream", async () => {
		const { result } = renderHook(
			() => useOrderStatus("6b0c2d8e-0000-4000-8000-000000000000"),
			{ wrapper: createWrapper() },
		);
		await waitFor(() => expect(result.current.order?.status).toBe("RECEIVED"));

		const source = FakeEventSource.instances[0]!;
		expect(source.url).toBe(
			"/api/v1/orders/6b0c2d8e-0000-4000-8000-000000000000/events",
		);
		act(() => source.onopen?.());
		expect(result.current.live).toBe(true);

		act(() => source.emit(order("PREPARING")));
		await waitFor(() => expect(result.current.order?.status).toBe("PREPARING"));
		expect(source.closed).toBe(false);
	});

	it("closes the stream once the order reaches a final status", async () => {
		const { result } = renderHook(
			() => useOrderStatus("6b0c2d8e-0000-4000-8000-000000000000"),
			{ wrapper: createWrapper() },
		);
		await waitFor(() => expect(result.current.order).toBeDefined());
		const source = FakeEventSource.instances[0]!;

		act(() => source.emit(order("DELIVERED")));

		await waitFor(() => expect(result.current.order?.status).toBe("DELIVERED"));
		expect(source.closed).toBe(true);
		expect(result.current.live).toBe(false);
	});

	it("closes the stream on unmount", () => {
		const { unmount } = renderHook(
			() => useOrderStatus("6b0c2d8e-0000-4000-8000-000000000000"),
			{ wrapper: createWrapper() },
		);
		unmount();
		expect(FakeEventSource.instances[0]?.closed).toBe(true);
	});
});
