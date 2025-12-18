import { Controller, Get, Param, Post, Body, Patch } from '@nestjs/common';
import { StaffUsersService } from './staff-users.service';

@Controller('staff-users')
export class StaffUsersController {
  constructor(private readonly staffUsersService: StaffUsersService) {}

  @Get()
  async findAll() {
    return this.staffUsersService.findAll();
  }

  @Get('by-auth/:authId')
  async getByAuthId(@Param('authId') authId: string) {
    return this.staffUsersService.findByAuthId(authId);
  }

  @Post()
  async createStaffUser(@Body() body: {
    authId: string;
    email: string;
    fullName: string;
    role?: 'admin' | 'manager' | 'supervisor' | 'viewer';
  }) {
    return this.staffUsersService.createStaffUser(body);
  }

  @Patch(':id')
  async updateStaffUser(
    @Param('id') id: string,
    @Body() body: {
      fullName?: string;
      role?: 'admin' | 'manager' | 'supervisor' | 'viewer';
      active?: boolean;
    }
  ) {
    return this.staffUsersService.updateStaffUser(id, body);
  }
}