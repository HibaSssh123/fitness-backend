import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { FoodLogsService } from './food-logs.service';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('food-logs')
@UseGuards(JwtAuthGuard)
export class FoodLogsController {
  constructor(private readonly foodLogsService: FoodLogsService) {}

  // POST /food-logs
  @Post()
  create(
    @Req() req: AuthedRequest,
    @Body() createFoodLogDto: CreateFoodLogDto,
  ) {
    return this.foodLogsService.create(req.user.sub, createFoodLogDto);
  }

  // GET /food-logs?date=YYYY-MM-DD
  @Get()
  getDailyLogs(@Req() req: AuthedRequest, @Query('date') date: string) {
    return this.foodLogsService.getDailyLogs(req.user.sub, date);
  }

  // GET /food-logs/totals?date=YYYY-MM-DD
  @Get('totals')
  getDailyTotals(@Req() req: AuthedRequest, @Query('date') date: string) {
    return this.foodLogsService.getDailyTotals(req.user.sub, date);
  }
}
