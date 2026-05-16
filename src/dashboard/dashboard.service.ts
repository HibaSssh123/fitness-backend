import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseDateRange } from '../food-logs/utils/date-range.util';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyProgress(userId: string, date?: string) {
    const dateKey = date ?? new Date().toISOString().split('T')[0];
    const { startDate, endDate } = parseDateRange(dateKey);

    const [activeGoal, logs] = await Promise.all([
      this.prisma.goal.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.foodLog.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { food: true },
      }),
    ]);

    const consumed = logs.reduce(
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

    const target = activeGoal
      ? {
          calories: activeGoal.targetCalories,
          protein: activeGoal.targetProtein,
          carbs: activeGoal.targetCarbs,
          fat: activeGoal.targetFat,
        }
      : null;

    return {
      date: dateKey,
      target,
      consumed,
      goalProgress: target
        ? {
            caloriesPct:
              target.calories > 0
                ? Number((consumed.calories / target.calories).toFixed(2))
                : null,
            proteinPct:
              (target.protein ?? 0) > 0
                ? Number((consumed.protein / (target.protein ?? 1)).toFixed(2))
                : null,
            carbsPct:
              (target.carbs ?? 0) > 0
                ? Number((consumed.carbs / (target.carbs ?? 1)).toFixed(2))
                : null,
            fatPct:
              (target.fat ?? 0) > 0
                ? Number((consumed.fat / (target.fat ?? 1)).toFixed(2))
                : null,
          }
        : null,
    };
  }
}
