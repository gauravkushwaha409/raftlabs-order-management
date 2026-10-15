import { toast } from "@package/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Notification } from "@/types/api";
import { notificationsApiService } from "./services/notifications-api.service";
import { useNotifications } from "./use-notifications";

vi.mock("./services/notifications-api.service", () => ({
	notificationsApiService: {
		getFeed: vi.fn(),
		markRead: vi.fn(),
		markAllRead: vi.fn(),
	},
}));
vi.mock("@/lib/api-client", () => ({
	notificationsStreamUrl: () => "/api/v1/notifications/stream",
}));
vi.mock("@package/ui", async (importOriginal) => ({
	...(await importOriginal<typeof import("@package/ui")>()),
	toast: vi.fn(),
}));

class FakeEventSource {
	static instances: FakeEventSource[] = [];
	closed = false;
	private listeners = new Map<string, (event: MessageEvent<string>) => void>();
	readonly url: string;
	readonly options?: EventSourceInit;

	constructor(url: string, options?: EventSourceInit) {
		this.url = url;
		this.options = options;
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
	emit(notification: Notification) {
		this.listeners.get("notification")?.({
			data: JSON.stringify(notification),
		} as MessageEvent<string>);
	}
}

const note = (id: string, read = false): Notification => ({
	id,
	orderId: "o1",
	title: `Title ${id}`,
	body: "Body",
	read,
	createdAt: "2026-10-15T10:00:00.000Z",
});

const createWrapper = () => {
	const client = new QueryClient();
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
};

describe("useNotifications", () => {
	beforeEach(() => {
		FakeEventSource.instances = [];
		vi.stubGlobal("EventSource", FakeEventSource);
		vi.mocked(notificationsApiService.getFeed).mockResolvedValue({
			data: { data: { items: [note("a")], unreadCount: 1 } },
		} as never);
		vi.mocked(notificationsApiService.markRead).mockResolvedValue({} as never);
		vi.mocked(notificationsApiService.markAllRead).mockResolvedValue({} as never);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.clearAllMocks();
	});

	it("loads the feed, then adds pushed notifications and raises a toast", async () => {
		const { result } = renderHook(() => useNotifications(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.feed.unreadCount).toBe(1));

		const source = FakeEventSource.instances[0]!;
		expect(source.url).toBe("/api/v1/notifications/stream");
		expect(source.options).toEqual({ withCredentials: true }); // the session cookie must reach the stream

		act(() => source.emit(note("b")));
		await waitFor(() => expect(result.current.feed.unreadCount).toBe(2));
		expect(result.current.feed.items.map((item) => item.id)).toEqual(["b", "a"]);
		expect(toast).toHaveBeenCalledWith("Title b", { description: "Body" });
	});

	it("lowers the unread count immediately when one is marked read", async () => {
		const { result } = renderHook(() => useNotifications(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.feed.unreadCount).toBe(1));

		act(() => result.current.markRead("a"));

		await waitFor(() => expect(result.current.feed.unreadCount).toBe(0));
		expect(vi.mocked(notificationsApiService.markRead).mock.calls[0]?.[0]).toBe(
			"a",
		);
	});

	it("marks everything read", async () => {
		const { result } = renderHook(() => useNotifications(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.feed.unreadCount).toBe(1));

		act(() => result.current.markAllRead());

		await waitFor(() => expect(result.current.feed.unreadCount).toBe(0));
		expect(notificationsApiService.markAllRead).toHaveBeenCalled();
	});

	it("closes the stream on unmount", async () => {
		const { unmount } = renderHook(() => useNotifications(), {
			wrapper: createWrapper(),
		});
		unmount();
		expect(FakeEventSource.instances[0]?.closed).toBe(true);
	});
});
