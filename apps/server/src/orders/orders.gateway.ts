import type { OnModuleInit } from "@nestjs/common";
import {
	type OnGatewayConnection,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service.js";
import { ACCESS_COOKIE } from "../auth/auth.types.js";
import { readCookie } from "../auth/cookies.js";
import { getCorsOrigins } from "../common/cors.js";
import { OrderEventsService } from "./order-events.service.js";

const ADMINS_ROOM = "admins";

/**
 * Pushes every order change to signed-in admins. The handshake carries the session cookie; events go
 * to the admins room only, so a socket still being verified can never receive one.
 */
@WebSocketGateway({
	namespace: "admin",
	cors: { origin: getCorsOrigins(), credentials: true },
})
export class OrdersGateway implements OnModuleInit, OnGatewayConnection {
	@WebSocketServer()
	private readonly server!: Namespace;

	constructor(
		private readonly events: OrderEventsService,
		private readonly auth: AuthService,
	) {}

	onModuleInit() {
		this.events.stream$.subscribe((event) =>
			this.server?.to(ADMINS_ROOM).emit("order", event),
		);
	}

	async handleConnection(client: Socket) {
		const user = await this.auth.authenticate(
			readCookie(client.handshake.headers.cookie, ACCESS_COOKIE),
		);
		if (user?.role !== "ADMIN") {
			client.emit("unauthorized");
			client.disconnect(true);
			return;
		}
		await client.join(ADMINS_ROOM);
	}
}
