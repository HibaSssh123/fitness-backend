import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExerciseType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @Get()
  list(
    @Query('type') type?: ExerciseType,
    @Query('category') categoryId?: string,
    @Query('search') search?: string,
    @Query('muscleGroup') muscleGroup?: string,
  ) {
    return this.exercisesService.list({
      type,
      categoryId,
      search,
      muscleGroup,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.exercisesService.getById(id);
  }
}
