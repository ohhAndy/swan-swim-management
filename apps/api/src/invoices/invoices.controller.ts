import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { InvoicesService } from "./invoices.service";
import {
  CreateInvoiceDto,
  CreateInvoiceSchema,
  UpdateInstallmentsDto,
  UpdateInstallmentsSchema,
} from "./dto/create-invoice.dto";
import { UpdateInvoiceDto, UpdateInvoiceSchema } from "./dto/update-invoice.dto";
import { InvoiceQueryDto, InvoiceQuerySchema } from "./dto/invoice-query.dto";
import {
  UnInvoicedEnrollmentsQueryDto,
  UnInvoicedEnrollmentsQuerySchema,
} from "./dto/uninvoiced-enrollments-query.dto";
import { MinRole } from "../auth/roles.decorator";
import { CurrentStaffUser } from "../auth/current-user.decorator";
import { CurrentLocationId } from "../auth/current-location.decorator";
import { RequestStaffUser } from "../auth/auth.types";

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @MinRole("manager")
  async create(
    @Body(new ZodValidationPipe(CreateInvoiceSchema))
    createInvoiceDto: CreateInvoiceDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.create(createInvoiceDto, staffUser, locationId);
  }

  // List invoices with filters - Admin & Manager only
  @Get()
  @MinRole("manager")
  async findAll(
    @Query(new ZodValidationPipe(InvoiceQuerySchema)) query: InvoiceQueryDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.findAll(query, staffUser, locationId);
  }

  // Get un-invoiced enrollments - Admin & Manager only
  @Get("un-invoiced-enrollments")
  @MinRole("manager")
  async getUnInvoicedEnrollments(
    @Query(new ZodValidationPipe(UnInvoicedEnrollmentsQuerySchema))
    query: UnInvoicedEnrollmentsQueryDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
    @CurrentLocationId() locationId?: string,
  ) {
    return this.invoicesService.getUnInvoicedEnrollments(
      query,
      staffUser,
      locationId,
    );
  }

  @Get(":id")
  @MinRole("manager")
  async findOne(@Param("id") id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(":id")
  @MinRole("manager")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateInvoiceSchema))
    updateInvoiceDto: UpdateInvoiceDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.invoicesService.update(id, updateInvoiceDto, staffUser);
  }

  // Replace the installment plan - Admin & Manager only
  @Put(":id/installments")
  @MinRole("manager")
  async updateInstallments(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateInstallmentsSchema))
    body: UpdateInstallmentsDto,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.invoicesService.updateInstallments(id, body, staffUser);
  }

  @Delete(":id")
  @MinRole("admin")
  async remove(
    @Param("id") id: string,
    @CurrentStaffUser() staffUser: RequestStaffUser,
  ) {
    return this.invoicesService.remove(id, staffUser);
  }
}
