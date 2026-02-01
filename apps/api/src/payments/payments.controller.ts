import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("payments")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles("super_admin", "admin", "manager")
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("method") method?: string,
    @Query("query") query?: string,
  ) {
    return this.paymentsService.findAll(
      page,
      limit,
      startDate,
      endDate,
      method,
      query,
    );
  }

  // Record payment - Admin & Manager only
  @Post()
  @Roles("super_admin", "admin", "manager")
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.paymentsService.create(createPaymentDto, staffUser);
  }

  // Get all payments for an invoice - Admin & Manager only
  @Get("invoice/:invoiceId")
  @Roles("super_admin", "admin", "manager")
  findByInvoice(@Param("invoiceId") invoiceId: string) {
    return this.paymentsService.findByInvoice(invoiceId);
  }

  // Get single payment - Admin & Manager only
  @Get(":id")
  @Roles("super_admin", "admin", "manager")
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(id);
  }

  // Delete payment - Admin only
  @Delete(":id")
  @Roles("super_admin", "admin")
  remove(@Param("id") id: string, @CurrentUser() staffUser: any) {
    return this.paymentsService.remove(id, staffUser);
  }

  // Update payment - Admin & Manager only
  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  update(
    @Param("id") id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.paymentsService.update(id, updatePaymentDto, staffUser);
  }
}
