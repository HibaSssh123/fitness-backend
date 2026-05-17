import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

type AuthedRequest = Request & { user: { sub: string; role?: string } };

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Get all users
   * GET /admin/users?page=1&limit=10&role=USER
   */
  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: 'USER' | 'ADMIN',
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      role,
    );
  }

  /**
   * Get admin analytics dashboard
   * GET /admin/analytics
   */
  @Get('analytics')
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  /**
   * Ban a user
   * PATCH /admin/users/:id/ban
   */
  @Patch('users/:id/ban')
  banUser(@Param('id') userId: string) {
    return this.adminService.toggleUserStatus(userId, false);
  }

  /**
   * Unban a user
   * PATCH /admin/users/:id/unban
   */
  @Patch('users/:id/unban')
  unbanUser(@Param('id') userId: string) {
    return this.adminService.toggleUserStatus(userId, true);
  }

  /**
   * Delete a user
   * DELETE /admin/users/:id
   */
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  /**
   * Promote a user to admin
   * PATCH /admin/users/:id/promote
   */
  @Patch('users/:id/promote')
  promoteToAdmin(@Param('id') userId: string) {
    return this.adminService.promoteToAdmin(userId);
  }

  /**
   * Demote an admin to user
   * PATCH /admin/users/:id/demote
   */
  @Patch('users/:id/demote')
  demoteFromAdmin(@Param('id') userId: string) {
    return this.adminService.demoteFromAdmin(userId);
  }
}
