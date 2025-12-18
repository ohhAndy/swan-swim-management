import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('payments')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Record payment - Admin & Manager only
  @Post()
  @Roles('admin', 'manager')
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.paymentsService.create(createPaymentDto, staffUser);
  }

  // Get all payments for an invoice - Admin & Manager only
  @Get('invoice/:invoiceId')
  @Roles('admin', 'manager')
  findByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.findByInvoice(invoiceId);
  }

  // Get single payment - Admin & Manager only
  @Get(':id')
  @Roles('admin', 'manager')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // Delete payment - Admin only
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}