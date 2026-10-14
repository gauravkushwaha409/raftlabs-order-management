import { Module } from "@nestjs/common";
import { OrderEventsService } from "./order-events.service.js";
import { OrderSimulatorService } from "./order-simulator.service.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersGateway } from "./orders.gateway.js";
import { OrdersService } from "./orders.service.js";

@Module({
	controllers: [OrdersController],
	providers: [
		OrdersService,
		OrderEventsService,
		OrderSimulatorService,
		OrdersGateway,
	],
})
export class OrdersModule {}
