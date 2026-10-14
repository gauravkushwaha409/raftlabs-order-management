import { canTransition, isFinalStatus, nextStatus } from "./order-status.js";

describe("order status rules", () => {
	it("allows the forward path", () => {
		expect(canTransition("RECEIVED", "PREPARING")).toBe(true);
		expect(canTransition("PREPARING", "OUT_FOR_DELIVERY")).toBe(true);
		expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
	});

	it("allows cancelling only before delivery starts", () => {
		expect(canTransition("RECEIVED", "CANCELLED")).toBe(true);
		expect(canTransition("PREPARING", "CANCELLED")).toBe(true);
		expect(canTransition("OUT_FOR_DELIVERY", "CANCELLED")).toBe(false);
	});

	it("rejects skipping, going backwards and staying put", () => {
		expect(canTransition("RECEIVED", "DELIVERED")).toBe(false);
		expect(canTransition("PREPARING", "RECEIVED")).toBe(false);
		expect(canTransition("RECEIVED", "RECEIVED")).toBe(false);
	});

	it("treats delivered and cancelled as final", () => {
		expect(isFinalStatus("DELIVERED")).toBe(true);
		expect(isFinalStatus("CANCELLED")).toBe(true);
		expect(isFinalStatus("PREPARING")).toBe(false);
	});

	it("walks the happy path for the simulator", () => {
		expect(nextStatus("RECEIVED")).toBe("PREPARING");
		expect(nextStatus("OUT_FOR_DELIVERY")).toBe("DELIVERED");
		expect(nextStatus("DELIVERED")).toBeUndefined();
	});
});
