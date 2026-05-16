import { Test, TestingModule } from '@nestjs/testing';
import { ExerciseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsService', () => {
  let service: WorkoutsService;

  const prismaMock = {
    exercise: {
      findMany: jest.fn(),
    },
    workout: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
    jest.clearAllMocks();
  });

  it('creates a workout and calculates total calories', async () => {
    prismaMock.exercise.findMany.mockResolvedValueOnce([
      { id: 'ex-1', type: ExerciseType.STRENGTH },
      { id: 'ex-2', type: ExerciseType.CARDIO },
    ]);
    prismaMock.workout.create.mockResolvedValueOnce({
      id: 'workout-1',
      totalCaloriesBurned: 328,
      exercises: [],
    });

    const result = await service.create('user-1', {
      duration: 50,
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [
            { reps: 10, weight: 45, rpe: 7, duration: 3 },
            { reps: 8, weight: 50, rpe: 8, duration: 3 },
            { reps: 6, weight: 55, rpe: 9, duration: 3 },
          ],
        },
        {
          exerciseId: 'ex-2',
          sets: [{ duration: 20, distance: 2 }],
        },
      ],
    });

    expect(prismaMock.workout.create).toHaveBeenCalledTimes(1);
    const createCalls = prismaMock.workout.create.mock.calls as Array<
      [unknown]
    >;
    expect(createCalls[0]?.[0]).toMatchObject({
      data: {
        userId: 'user-1',
        totalCaloriesBurned: 328,
        exercises: {
          create: [
            expect.objectContaining({
              exerciseId: 'ex-1',
              caloriesBurned: 48,
              sets: 3,
              workoutSets: {
                create: [
                  expect.objectContaining({
                    setNumber: 1,
                    reps: 10,
                    weight: 45,
                  }),
                  expect.objectContaining({
                    setNumber: 2,
                    reps: 8,
                    weight: 50,
                  }),
                  expect.objectContaining({
                    setNumber: 3,
                    reps: 6,
                    weight: 55,
                  }),
                ],
              },
            }),
            expect.objectContaining({
              exerciseId: 'ex-2',
              caloriesBurned: 280,
            }),
          ],
        },
      },
    });
    expect(result).toEqual({
      id: 'workout-1',
      totalCaloriesBurned: 328,
      exercises: [],
    });
  });

  it('lists workouts with pagination defaults', async () => {
    prismaMock.workout.count.mockResolvedValueOnce(1);
    prismaMock.workout.findMany.mockResolvedValueOnce([
      { id: 'workout-1', exercises: [] },
    ]);

    const result = await service.list('user-1', {});

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('builds weekly summary totals', async () => {
    prismaMock.workout.findMany.mockResolvedValueOnce([
      {
        duration: 45,
        totalCaloriesBurned: 320,
        exercises: [{ exercise: { type: ExerciseType.STRENGTH } }],
      },
      {
        duration: 30,
        totalCaloriesBurned: 260,
        exercises: [{ exercise: { type: ExerciseType.CARDIO } }],
      },
    ]);

    const result = await service.getSummary('user-1', 'week');

    expect(result.totalWorkouts).toBe(2);
    expect(result.totalDurationMinutes).toBe(75);
    expect(result.totalCaloriesBurned).toBe(580);
    expect(result.strengthSessions).toBe(1);
    expect(result.cardioSessions).toBe(1);
  });
});
