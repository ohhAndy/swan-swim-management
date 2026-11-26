import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto, CreatePaymentSchema } from "./dto/create-payment.dto";
import { UpdatePaymentDto, UpdatePaymentSchema } from "./dto/update-payment.dto";
import { PaymentQueryDto, PaymentQuerySchema } from "./dto/payment-query.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { RequestStaffUser } from "../auth/auth.types";
import {
  CurrentLocationScope,
  fromBody,
  fromParam,
  LocationScope,
  ScopedTo,
} from "../auth/location-scope";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @MinRole("manager")
  findAll(
    @Query(new ZodValidationPipe(PaymentQuerySchema)) q: PaymentQueryDto,
    @CurrentLocationScope() scope: LocationScope,
  ) {
    return this.paymentsService.findAll(
      q.page,
      q.limit,
      q.startDate,
      q.endDate,
      q.method,
      q.query,
      scope,
    );
  }

  // Record payment - Admin & Manager only
  @Post()
  @MinRole("manager")
  @ScopedTo(fromBody("invoice", "invoiceId"))
  create(
    @Body(new ZodValidationPipe(CreatePaymentSchema))
    createPaymentDto: CreatePaymentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.paymentsService.create(createPaymentDto, staffUser);
  }

  // Get all payments for an invoice - Admin & Manager only
  @Get("invoice/:invoiceId")
  @MinRole("manager")
  @ScopedTo(fromParam("invoice", "invoiceId"))
  findByInvoice(@Param("invoiceId") invoiceId: string) {
    return this.paymentsService.findByInvoice(invoiceId);
  }

  @Get(":id")
  @MinRole("manager")
  @ScopedTo(fromParam("payment", "id"))
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  @Delete(":id")
  @MinRole("admin")
  remove(@Param("id") id: string, @CurrentStaffUser() staffUser: RequestStaffUser) {
    return this.paymentsService.remove(id, staffUser);
  }

  @Patch(":id")
  @MinRole("manager")
  @ScopedTo(fromParam("payment", "id"))
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdatePaymentSchema))
    updatePaymentDto: UpdatePaymentDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, staffUser);
  }
}
