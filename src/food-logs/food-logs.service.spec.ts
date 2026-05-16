import { Test, TestingModule } from '@nestjs/testing';
import { FoodLogsService } from './food-logs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FoodLogsService', () => {
  let service: FoodLogsService;

  const prismaMock = {
    foodLog: {
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
});
