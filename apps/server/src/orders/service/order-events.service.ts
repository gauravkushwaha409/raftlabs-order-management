import { Injectable } from "@nestjs/common";
import { REDIS_CHANNELS } from "../../common/constant/redis-keys.js";
import { RedisChannel } from "../../redis/redis-channel.js";
import type { OrderView } from "../dto/order.view.js";

export interface OrderEvent {
	type: "created" | "updated" | "deleted";
	order: OrderView;
}

/** Live order changes for SSE streams, the admin websocket and the simulator. */
@Injectable()
export class OrderEventsService extends RedisChannel<OrderEvent> {
	protected readonly channel = REDIS_CHANNELS.ORDER_EVENTS;
}
