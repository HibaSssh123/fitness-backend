import { Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createExerciseDto: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data: createExerciseDto,
      include: { category: true },
    });
  }

  list(filters: {
    type?: ExerciseType;
    categoryId?: string;
    search?: string;
    muscleGroup?: string;
  }) {
    const { type, categoryId, search, muscleGroup } = filters;

    return this.prisma.exercise.findMany({
      where: {
        type,
        categoryId,
        ...(search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
        ...(muscleGroup
          ? {
              targetMuscles: {
                has: muscleGroup,
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }
}
