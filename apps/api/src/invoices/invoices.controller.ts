import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { InvoiceQueryDto } from "./dto/invoice-query.dto";
import { UnInvoicedEnrollmentsQueryDto } from "./dto/uninvoiced-enrollments-query.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentStaffUser, CurrentUser } from "../auth/current-user.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";

@Controller("invoices")
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Create invoice - Admin & Manager only
  @Post()
  @Roles("super_admin", "admin", "manager")
  async create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() staffUser: any,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.create(createInvoiceDto, staffUser, locationId);
  }

  // List invoices with filters - Admin & Manager only
  @Get()
  @Roles("super_admin", "admin", "manager")
  async findAll(
    @Query() query: InvoiceQueryDto,
    @CurrentUser() staffUser: any,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.findAll(query, staffUser, locationId);
  }

  // Get un-invoiced enrollments - Admin & Manager only
  @Get("un-invoiced-enrollments")
  @Roles("super_admin", "admin", "manager")
  async getUnInvoicedEnrollments(
    @Query() query: UnInvoicedEnrollmentsQueryDto,
    @CurrentUser() staffUser: any,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.getUnInvoicedEnrollments(
      query,
      staffUser,
      locationId,
    );
  }

  // Get single invoice - Admin & Manager only
  @Get(":id")
  @Roles("super_admin", "admin", "manager")
  async findOne(@Param("id") id: string) {
    return this.invoicesService.findOne(id);
  }

  // Update invoice - Admin & Manager only
  @Patch(":id")
  @Roles("super_admin", "admin", "manager")
  async update(
    @Param("id") id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @CurrentUser() staffUser: any,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, staffUser);
  }

  // Delete invoice - Admin only
  @Delete(":id")
  @Roles("super_admin", "admin")
  async remove(@Param("id") id: string, @CurrentUser() staffUser: any) {
    return this.invoicesService.remove(id, staffUser);
  }
}
