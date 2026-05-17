import { Controller, Get, Post, Req, UseGuards, Query } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProgressService } from './progress.service';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * Record daily progress metrics
   * POST /progress/record
   */
  @Post('record')
  async recordProgress(@Req() req: AuthedRequest) {
    return this.progressService.recordDailyProgress(req.user.sub);
  }

  /**
   * Get progress summary for a period
   * GET /progress/summary?days=30
   */
  @Get('summary')
  async getProgressSummary(
    @Req() req: AuthedRequest,
    @Query('days') days?: string,
  ): Promise<Record<string, any> | null> {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.progressService.getProgressSummary(req.user.sub, daysNum);
  }

  /**
   * Get progress predictions
   * GET /progress/predictions
   */
  @Get('predictions')
  async getPredictions(@Req() req: AuthedRequest) {
    return this.progressService.getProgressPredictions(req.user.sub);
  }

  /**
   * Get weight history for charting
   * GET /progress/weight-history?days=30
   */
  @Get('weight-history')
  async getWeightHistory(
    @Req() req: AuthedRequest,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.progressService.getWeightHistory(req.user.sub, daysNum);
  }

  /**
   * Get calorie tracking history
   * GET /progress/calorie-history?days=30
   */
  @Get('calorie-history')
  async getCalorieHistory(
    @Req() req: AuthedRequest,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.progressService.getCalorieHistory(req.user.sub, daysNum);
  }
}
