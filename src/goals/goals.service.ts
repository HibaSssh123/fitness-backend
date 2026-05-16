import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    await this.prisma.goal.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    const goal = await this.prisma.goal.create({
      data: {
        userId,
        ...createGoalDto,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        calorieTarget: goal.targetCalories,
        proteinTarget: goal.targetProtein,
        carbsTarget: goal.targetCarbs,
        fatTarget: goal.targetFat,
      },
    });

    return goal;
  }

  async getCurrentGoal(userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!goal) {
      throw new NotFoundException('No active goal found');
    }

    return goal;
  }

  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (updateGoalDto.isActive === true) {
      await this.prisma.goal.updateMany({
        where: { userId, isActive: true, id: { not: id } },
        data: { isActive: false, endDate: new Date() },
      });
    }

    return this.prisma.goal.update({
      where: { id },
      data: updateGoalDto,
    });
  }

  async getProgress(userId: string, period: 'today' | 'week') {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      const day = startDate.getDay();
      const diff = day === 0 ? 6 : day - 1;
      startDate.setDate(startDate.getDate() - diff);
    }

    const goal = await this.prisma.goal.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const logs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: { food: true },
    });

    const totals = logs.reduce(
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

    return {
      period,
      startDate,
      endDate: now,
      target: goal
        ? {
            calories: goal.targetCalories,
            protein: goal.targetProtein,
            carbs: goal.targetCarbs,
            fat: goal.targetFat,
          }
        : null,
      consumed: totals,
      remaining: goal
        ? {
            calories: goal.targetCalories - totals.calories,
            protein: (goal.targetProtein ?? 0) - totals.protein,
            carbs: (goal.targetCarbs ?? 0) - totals.carbs,
            fat: (goal.targetFat ?? 0) - totals.fat,
          }
        : null,
    };
  }
}
