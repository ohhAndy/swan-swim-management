import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { UnInvoicedEnrollmentsQueryDto } from './dto/uninvoiced-enrollments-query.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentStaffUser, CurrentUser } from '../auth/current-user.decorator';

@Controller('invoices')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Create invoice - Admin & Manager only
  @Post()
  @Roles('admin', 'manager')
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.invoicesService.create(createInvoiceDto, staffUser);
  }

  // List invoices with filters - Admin & Manager only
  @Get()
  @Roles('admin', 'manager')
  async findAll(@Query() query: InvoiceQueryDto) {
    return this.invoicesService.findAll(query);
  }

  // Get un-invoiced enrollments - Admin & Manager only
  @Get('un-invoiced-enrollments')
  @Roles('admin', 'manager')
  async getUnInvoicedEnrollments(@Query() query: UnInvoicedEnrollmentsQueryDto) {
    return this.invoicesService.getUnInvoicedEnrollments(query);
  }

  // Get single invoice - Admin & Manager only
  @Get(':id')
  @Roles('admin', 'manager')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  // Update invoice - Admin & Manager only
  @Patch(':id')
  @Roles('admin', 'manager')
  async update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, staffUser);
  }

  // Delete invoice - Admin only
  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}