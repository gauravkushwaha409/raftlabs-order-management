import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { OrderEventsService } from "./order-events.service.js";
import { OrderSimulatorService } from "./order-simulator.service.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersGateway } from "./orders.gateway.js";
import { OrdersService } from "./orders.service.js";

@Module({
	imports: [AuthModule],
	controllers: [OrdersController],
	providers: [
		OrdersService,
		OrderEventsService,
		OrderSimulatorService,
		OrdersGateway,
	],
})
export class OrdersModule {}
