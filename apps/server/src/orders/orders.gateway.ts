import type { OnModuleInit } from "@nestjs/common";
import {
	type OnGatewayConnection,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import { isValidAdminKey } from "../common/admin-key.js";
import { getCorsOrigins } from "../common/cors.js";
import { OrderEventsService } from "./order-events.service.js";

/** Pushes every order change to connected admin dashboards. Handshake must carry `auth.key`. */
@WebSocketGateway({
	namespace: "admin",
	cors: { origin: getCorsOrigins(), credentials: true },
})
export class OrdersGateway implements OnModuleInit, OnGatewayConnection {
	@WebSocketServer()
	private readonly server!: Namespace;

	constructor(private readonly events: OrderEventsService) {}

	onModuleInit() {
		this.events.stream$.subscribe((event) => this.server?.emit("order", event));
	}

	handleConnection(client: Socket) {
		if (!isValidAdminKey(client.handshake.auth?.key)) {
			client.emit("unauthorized");
			client.disconnect(true);
		}
	}
}
