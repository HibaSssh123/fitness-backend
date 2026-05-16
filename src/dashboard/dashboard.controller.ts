import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard/daily
  @Get('daily')
  getDaily(@Req() req: AuthedRequest, @Query('date') date?: string) {
    return this.dashboardService.getDailyProgress(req.user.sub, date);
  }
}
