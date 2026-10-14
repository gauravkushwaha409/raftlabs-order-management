import type { Order, OrderEvent } from "@/types/api";
import { applyOrderEvent } from "./order-cache";

const order = (id: string, status: Order["status"] = "RECEIVED"): Order => ({
	id,
	customerName: "Ada",
	address: "12 Analytical Way",
	phone: "+44 20 7946 0000",
	status,
	totalCents: 1000,
	items: [],
	createdAt: "2026-10-14T10:00:00.000Z",
	updatedAt: "2026-10-14T10:00:00.000Z",
});

const event = (type: OrderEvent["type"], o: Order): OrderEvent => ({
	type,
	order: o,
});

describe("applyOrderEvent", () => {
	it("prepends created orders and ignores duplicates", () => {
		const list = [order("a")];
		expect(
			applyOrderEvent(list, event("created", order("b"))).map((o) => o.id),
		).toEqual(["b", "a"]);
		expect(applyOrderEvent(list, event("created", order("a")))).toBe(list);
	});

	it("replaces updated orders in place", () => {
		const result = applyOrderEvent(
			[order("a"), order("b")],
			event("updated", order("a", "PREPARING")),
		);
		expect(result.map((o) => `${o.id}:${o.status}`)).toEqual([
			"a:PREPARING",
			"b:RECEIVED",
		]);
	});

	it("removes deleted orders", () => {
		expect(
			applyOrderEvent([order("a"), order("b")], event("deleted", order("a"))).map(
				(o) => o.id,
			),
		).toEqual(["b"]);
	});
});
