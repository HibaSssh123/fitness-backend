import { Test, TestingModule } from '@nestjs/testing';
import { FoodLogsService } from './food-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FoodLogsService', () => {
  let service: FoodLogsService;

  type FoodLogCreateArgs = {
    data: {
      userId: string;
      foodId: string;
      serving: number;
      servingUnit: string;
      mealType: string;
      date: Date;
    };
    include: { food: boolean };
  };

  const prismaMock = {
    foodLog: {
      create: jest.fn<Promise<{ id: string }>, [FoodLogCreateArgs]>(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodLogsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<FoodLogsService>(FoodLogsService);
    jest.clearAllMocks();
  });

  it('calculates daily totals from logs', async () => {
    prismaMock.foodLog.findMany.mockResolvedValueOnce([
      {
        serving: 2,
        food: { calories: 100, protein: 10, carbs: 20, fat: 5 },
      },
      {
        serving: 1,
        food: { calories: 50, protein: 0, carbs: 10, fat: 1 },
      },
    ]);

    const totals = await service.getDailyTotals('u1', '2026-05-16');

    expect(totals.calories).toBe(250);
    expect(totals.protein).toBe(20);
    expect(totals.carbs).toBe(50);
    expect(totals.fat).toBe(11);
  });

  it('creates a food log with meal type and serving unit defaults', async () => {
    prismaMock.foodLog.create.mockResolvedValueOnce({ id: 'log-1' });

    await service.create('u1', { foodId: 'food-1', serving: 1.5 });

    const createArgs = prismaMock.foodLog.create.mock.calls[0]?.[0];
    expect(createArgs).toBeDefined();
    expect(createArgs?.include).toEqual({ food: true });
    expect(createArgs?.data.userId).toBe('u1');
    expect(createArgs?.data.foodId).toBe('food-1');
    expect(createArgs?.data.serving).toBe(1.5);
    expect(createArgs?.data.servingUnit).toBe('SERVING');
    expect(createArgs?.data.mealType).toBe('SNACK');
    expect(createArgs?.data.date).toBeInstanceOf(Date);
  });
});
