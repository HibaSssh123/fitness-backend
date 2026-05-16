import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ExerciseType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutsService } from './workouts.service';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  create(
    @Req() req: AuthedRequest,
    @Body() createWorkoutDto: CreateWorkoutDto,
  ) {
    return this.workoutsService.create(req.user.sub, createWorkoutDto);
  }

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: ExerciseType,
    @Query('muscleGroup') muscleGroup?: string,
  ) {
    return this.workoutsService.list(req.user.sub, {
      startDate,
      endDate,
      page,
      limit,
      type,
      muscleGroup,
    });
  }

  @Get('summary')
  getSummary(
    @Req() req: AuthedRequest,
    @Query('period') period?: 'week' | 'month',
  ) {
    return this.workoutsService.getSummary(req.user.sub, period ?? 'week');
  }

  @Get(':id')
  getById(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.workoutsService.getById(req.user.sub, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() updateWorkoutDto: UpdateWorkoutDto,
  ) {
    return this.workoutsService.update(req.user.sub, id, updateWorkoutDto);
  }

  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.workoutsService.remove(req.user.sub, id);
  }
}
