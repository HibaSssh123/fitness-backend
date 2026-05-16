import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { GoalsService } from './goals.service';
import { UpdateGoalDto } from './dto/update-goal.dto';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  // POST /goals
  @Post()
  create(@Req() req: AuthedRequest, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(req.user.sub, createGoalDto);
  }

  // GET /goals
  @Get()
  getCurrentGoal(@Req() req: AuthedRequest) {
    return this.goalsService.getCurrentGoal(req.user.sub);
  }

  // PATCH /goals/:id
  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(req.user.sub, id, updateGoalDto);
  }

  // GET /goals/progress?period=today|week
  @Get('progress')
  getProgress(
    @Req() req: AuthedRequest,
    @Query('period') period?: 'today' | 'week',
  ) {
    return this.goalsService.getProgress(req.user.sub, period ?? 'today');
  }
}
