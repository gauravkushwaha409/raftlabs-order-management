import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { OrderEventsController } from "./controller/order-events.controller.js";
import { OrdersController } from "./controller/orders.controller.js";
import { OrdersGateway } from "./gateway/orders.gateway.js";
import { OrderEventsService } from "./service/order-events.service.js";
import { OrderSimulatorService } from "./service/order-simulator.service.js";
import { OrdersService } from "./service/orders.service.js";

@Module({
	imports: [AuthModule],
	controllers: [OrdersController, OrderEventsController],
	providers: [
		OrdersService,
		OrderEventsService,
		OrderSimulatorService,
		OrdersGateway,
	],
})
export class OrdersModule {}
