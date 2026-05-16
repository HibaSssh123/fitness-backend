import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExerciseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddExerciseToWorkoutDto } from './dto/add-exercise-to-workout.dto';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createWorkoutDto: CreateWorkoutDto) {
    const preparedExercises = await this.prepareWorkoutExercises(
      createWorkoutDto.exercises ?? [],
    );

    return this.prisma.workout.create({
      data: {
        userId,
        date: createWorkoutDto.date
          ? new Date(createWorkoutDto.date)
          : new Date(),
        duration: createWorkoutDto.duration,
        notes: createWorkoutDto.notes,
        totalCaloriesBurned: preparedExercises.totalCaloriesBurned,
        exercises: preparedExercises.entries.length
          ? { create: preparedExercises.entries }
          : undefined,
      },
      include: {
        exercises: {
          include: { exercise: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async list(
    userId: string,
    query: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      type?: ExerciseType;
      muscleGroup?: string;
    },
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where = {
      userId,
      ...(query.startDate || query.endDate
        ? {
            date: {
              ...(query.startDate
                ? { gte: this.parseDate(query.startDate, 'startDate') }
                : {}),
              ...(query.endDate
                ? { lte: this.parseDate(query.endDate, 'endDate') }
                : {}),
            },
          }
        : {}),
      ...(query.type || query.muscleGroup
        ? {
            exercises: {
              some: {
                exercise: {
                  ...(query.type ? { type: query.type } : {}),
                  ...(query.muscleGroup
                    ? { targetMuscles: { has: query.muscleGroup } }
                    : {}),
                },
              },
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.workout.count({ where }),
      this.prisma.workout.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getById(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, userId },
      include: {
        exercises: {
          include: { exercise: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return workout;
  }

  async update(userId: string, id: string, updateWorkoutDto: UpdateWorkoutDto) {
    const existing = await this.prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Workout not found');
    }

    const preparedExercises = updateWorkoutDto.exercises
      ? await this.prepareWorkoutExercises(updateWorkoutDto.exercises)
      : null;

    return this.prisma.workout.update({
      where: { id },
      data: {
        ...(updateWorkoutDto.date
          ? { date: new Date(updateWorkoutDto.date) }
          : {}),
        ...(updateWorkoutDto.duration !== undefined
          ? { duration: updateWorkoutDto.duration }
          : {}),
        ...(updateWorkoutDto.notes !== undefined
          ? { notes: updateWorkoutDto.notes }
          : {}),
        ...(preparedExercises
          ? {
              totalCaloriesBurned: preparedExercises.totalCaloriesBurned,
              exercises: {
                deleteMany: {},
                create: preparedExercises.entries,
              },
            }
          : {}),
      },
      include: {
        exercises: {
          include: { exercise: { include: { category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id, userId },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    await this.prisma.workout.delete({ where: { id } });
    return { success: true };
  }

  async getSummary(userId: string, period: 'week' | 'month' = 'week') {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      const day = startDate.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate.setDate(startDate.getDate() - diff);
    } else {
      startDate.setDate(1);
    }

    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
        },
      },
    });

    const strengthSessions = workouts.filter((workout) =>
      workout.exercises.some(
        (workoutExercise) =>
          workoutExercise.exercise.type === ExerciseType.STRENGTH,
      ),
    ).length;

    const cardioSessions = workouts.filter((workout) =>
      workout.exercises.some(
        (workoutExercise) =>
          workoutExercise.exercise.type === ExerciseType.CARDIO,
      ),
    ).length;

    return {
      period,
      startDate,
      endDate: now,
      totalWorkouts: workouts.length,
      totalDurationMinutes: workouts.reduce(
        (sum, workout) => sum + (workout.duration ?? 0),
        0,
      ),
      totalCaloriesBurned: workouts.reduce(
        (sum, workout) => sum + workout.totalCaloriesBurned,
        0,
      ),
      strengthSessions,
      cardioSessions,
    };
  }

  private parseDate(value: string, field: string) {
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid ${field} date`);
    }
    return parsedDate;
  }

  private async prepareWorkoutExercises(exercises: AddExerciseToWorkoutDto[]) {
    if (!exercises.length) {
      return { entries: [], totalCaloriesBurned: 0 };
    }

    const uniqueExerciseIds = [
      ...new Set(exercises.map((exercise) => exercise.exerciseId)),
    ];
    const dbExercises = await this.prisma.exercise.findMany({
      where: { id: { in: uniqueExerciseIds } },
      select: { id: true, type: true },
    });

    if (dbExercises.length !== uniqueExerciseIds.length) {
      throw new NotFoundException('One or more exercises were not found');
    }

    const exerciseTypeMap = new Map(
      dbExercises.map((exercise) => [exercise.id, exercise.type]),
    );

    const entries = exercises.map((exerciseEntry) => {
      const exerciseType = exerciseTypeMap.get(exerciseEntry.exerciseId);
      if (!exerciseType) {
        throw new NotFoundException('Exercise not found');
      }

      const caloriesBurned = this.calculateCalories(
        exerciseType,
        exerciseEntry,
      );

      return {
        ...exerciseEntry,
        caloriesBurned,
      };
    });

    return {
      entries,
      totalCaloriesBurned: entries.reduce(
        (sum, exerciseEntry) => sum + exerciseEntry.caloriesBurned,
        0,
      ),
    };
  }

  private calculateCalories(
    exerciseType: ExerciseType,
    exercise: AddExerciseToWorkoutDto,
  ) {
    if (exerciseType === ExerciseType.CARDIO) {
      const durationCalories = (exercise.duration ?? 0) * 8;
      const distanceCalories = (exercise.distance ?? 0) * 60;
      return Math.round(durationCalories + distanceCalories);
    }

    const sets = exercise.sets ?? 0;
    const reps = exercise.reps ?? 0;
    const weight = exercise.weight ?? 0;
    const estimatedDuration = exercise.duration ?? sets * 3;
    const effortFactor = (exercise.rpe ?? 6) / 10;
    const volume = sets * reps * weight;
    return Math.round(estimatedDuration * 5 * effortFactor + volume * 0.01);
  }
}
