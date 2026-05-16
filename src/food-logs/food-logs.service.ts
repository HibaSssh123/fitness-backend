import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { parseDateRange } from './utils/date-range.util';

@Injectable()
export class FoodLogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createFoodLogDto: CreateFoodLogDto) {
    return this.prisma.foodLog.create({
      data: {
        userId,
        foodId: createFoodLogDto.foodId,
        serving: createFoodLogDto.serving ?? 1,
        date: createFoodLogDto.date
          ? new Date(createFoodLogDto.date)
          : new Date(),
      },
      include: { food: true },
    });
  }

  async getDailyLogs(userId: string, date: string) {
    const { startDate, endDate } = parseDateRange(date);
    const logs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { food: true },
      orderBy: { date: 'asc' },
    });

    return {
      date,
      logs,
      totals: this.calculateTotals(logs),
    };
  }

  async getDailyTotals(userId: string, date: string) {
    const { startDate, endDate } = parseDateRange(date);
    const logs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { food: true },
    });

    return {
      date,
      ...this.calculateTotals(logs),
    };
  }

  private calculateTotals(
    logs: Array<{
      serving: number;
      food: {
        calories: number;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
      };
    }>,
  ) {
    return logs.reduce(
      (acc, log) => {
        const serving = log.serving;
        acc.calories += Math.round(log.food.calories * serving);
        acc.protein += (log.food.protein ?? 0) * serving;
        acc.carbs += (log.food.carbs ?? 0) * serving;
        acc.fat += (log.food.fat ?? 0) * serving;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }
}
