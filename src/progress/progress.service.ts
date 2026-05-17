import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate and record daily progress metrics for a user
   */
  async recordDailyProgress(userId: string, metricDate: Date = new Date()) {
    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Get food logs for the day
    const dayStart = new Date(metricDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(metricDate);
    dayEnd.setHours(23, 59, 59, 999);

    const foodLogs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        food: true,
      },
    });

    // Calculate consumed macros
    let calorieConsumed = 0;
    let proteinConsumed = 0;
    let carbsConsumed = 0;
    let fatConsumed = 0;

    foodLogs.forEach((log) => {
      const multiplier = log.serving || 1;
      calorieConsumed += (log.food.calories || 0) * multiplier;
      proteinConsumed += (log.food.protein || 0) * multiplier;
      carbsConsumed += (log.food.carbs || 0) * multiplier;
      fatConsumed += (log.food.fat || 0) * multiplier;
    });

    // Calculate adherence percentage
    const calorieAdherencePercent = user.calorieTarget
      ? Math.round((calorieConsumed / user.calorieTarget) * 100)
      : null;

    // Get workouts for the day
    const workouts = await this.prisma.workout.findMany({
      where: {
        userId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    let totalCaloriesBurned = 0;
    workouts.forEach((w) => {
      totalCaloriesBurned += w.totalCaloriesBurned || 0;
    });

    // Get active goal progress
    const activeGoal = await this.prisma.goal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    let goalProgressPercent = 0;
    if (activeGoal) {
      if (
        activeGoal.type === 'LOSE_WEIGHT' &&
        activeGoal.startWeightKg &&
        activeGoal.targetWeightKg
      ) {
        const latestGoalLog = await this.prisma.goalLog.findFirst({
          where: {
            goalId: activeGoal.id,
            userId,
          },
          orderBy: {
            logDate: 'desc',
          },
        });

        if (latestGoalLog?.weightKg) {
          const totalLoss =
            activeGoal.startWeightKg - activeGoal.targetWeightKg;
          const currentLoss = activeGoal.startWeightKg - latestGoalLog.weightKg;
          goalProgressPercent = Math.round((currentLoss / totalLoss) * 100);
        }
      }
    }

    // Create or update progress metric
    const existingMetric = await this.prisma.progressMetric.findFirst({
      where: {
        userId,
        metricDate: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existingMetric) {
      return this.prisma.progressMetric.update({
        where: { id: existingMetric.id },
        data: {
          weightKg: user.weight ? user.weight : undefined,
          calorieTarget: user.calorieTarget || undefined,
          calorieConsumed,
          calorieAdherencePercent,
          proteinTarget: user.proteinTarget || undefined,
          proteinConsumed,
          carbsTarget: user.carbsTarget || undefined,
          carbsConsumed,
          fatTarget: user.fatTarget || undefined,
          fatConsumed,
          workoutsCompleted: workouts.length,
          totalCaloriesBurned,
          goalProgressPercent,
        },
      });
    } else {
      return this.prisma.progressMetric.create({
        data: {
          userId,
          metricDate: dayStart,
          weightKg: user.weight ? user.weight : undefined,
          calorieTarget: user.calorieTarget || undefined,
          calorieConsumed,
          calorieAdherencePercent,
          proteinTarget: user.proteinTarget || undefined,
          proteinConsumed,
          carbsTarget: user.carbsTarget || undefined,
          carbsConsumed,
          fatTarget: user.fatTarget || undefined,
          fatConsumed,
          workoutsCompleted: workouts.length,
          totalCaloriesBurned,
          goalProgressPercent,
        },
      });
    }
  }

  /**
   * Get progress summary for a period
   */
  async getProgressSummary(
    userId: string,
    days: number = 30,
  ) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await this.prisma.progressMetric.findMany({
      where: {
        userId,
        metricDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        metricDate: 'asc',
      },
    });

    if (metrics.length === 0) {
      return null;
    }

    // Calculate averages
    const avgCalorieAdherence =
      metrics.reduce((sum, m) => sum + (m.calorieAdherencePercent || 0), 0) /
      metrics.length;
    const avgGoalProgress =
      metrics.reduce((sum, m) => sum + (m.goalProgressPercent || 0), 0) /
      metrics.length;
    const totalWorkouts = metrics.reduce(
      (sum, m) => sum + m.workoutsCompleted,
      0,
    );
    const totalCaloriesBurned = metrics.reduce(
      (sum, m) => sum + m.totalCaloriesBurned,
      0,
    );

    const firstMetric = metrics[0];
    const lastMetric = metrics[metrics.length - 1];

    // Calculate weight trend
    const weightTrend =
      firstMetric.weightKg && lastMetric.weightKg
        ? lastMetric.weightKg - firstMetric.weightKg
        : 0;

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: metrics.length,
      },
      weight: {
        current: lastMetric.weightKg || null,
        start: firstMetric.weightKg || null,
        trend: weightTrend,
      },
      calories: {
        avgAdherence: Math.round(avgCalorieAdherence * 100) / 100,
        totalBurned: totalCaloriesBurned,
      },
      goals: {
        avgProgress: Math.round(avgGoalProgress * 100) / 100,
      },
      activities: {
        totalWorkouts,
        avgWorkoutsPerDay: Math.round((totalWorkouts / metrics.length) * 100) / 100,
      },
      dailyMetrics: metrics.map((m) => ({
        date: m.metricDate.toISOString().split('T')[0],
        weight: m.weightKg,
        calorieConsumed: m.calorieConsumed,
        calorieTarget: m.calorieTarget,
        calorieAdherence: m.calorieAdherencePercent,
        workouts: m.workoutsCompleted,
        caloriesBurned: m.totalCaloriesBurned,
        goalProgress: m.goalProgressPercent,
      })),
    };
  }

  /**
   * Get progress predictions
   */
  async getProgressPredictions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const activeGoal = await this.prisma.goal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get last 30 days of progress
    const summary = await this.getProgressSummary(userId, 30);

    if (!summary) {
      return null;
    }

    // Simple linear prediction
    const predictions: any = {
      predictions: [],
    };

    if (activeGoal && activeGoal.type === 'LOSE_WEIGHT') {
      const dailyMetrics = summary.dailyMetrics;
      if (dailyMetrics.length >= 2) {
        // Calculate average weight loss per day
        const firstDay = parseFloat(dailyMetrics[0].weight || '0');
        const lastDay = parseFloat(
          dailyMetrics[dailyMetrics.length - 1].weight || '0',
        );
        const avgWeightLossPerDay = (firstDay - lastDay) / dailyMetrics.length;

        const currentWeight = lastDay;
        const targetWeight = activeGoal.targetWeightKg || 0;
        const daysToTarget = Math.max(
          0,
          (currentWeight - targetWeight) / Math.max(avgWeightLossPerDay, 0.01),
        );

        predictions.predictions.push({
          type: 'weight_loss',
          currentWeight: currentWeight,
          targetWeight: targetWeight,
          avgWeightChangePerDay: Math.round(avgWeightLossPerDay * 100) / 100,
          daysToTarget: Math.round(daysToTarget),
          estimatedCompletionDate: new Date(
            Date.now() + daysToTarget * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split('T')[0],
        });
      }
    }

    // Predict 7-day and 30-day weight if we have current weight
    if (user.weight && activeGoal && activeGoal.type === 'LOSE_WEIGHT') {
      const dailyMetrics = summary.dailyMetrics;
      if (dailyMetrics.length >= 2) {
        const firstDay = parseFloat(dailyMetrics[0].weight || user.weight.toString());
        const lastDay = parseFloat(
          dailyMetrics[dailyMetrics.length - 1].weight || user.weight.toString(),
        );
        const avgWeightLossPerDay = (firstDay - lastDay) / dailyMetrics.length;

        const current7DayPrediction = lastDay - avgWeightLossPerDay * 7;
        const current30DayPrediction = lastDay - avgWeightLossPerDay * 30;

        predictions.predictions.push({
          type: 'weight_projection',
          projectedWeightIn7Days: Math.round(current7DayPrediction * 100) / 100,
          projectedWeightIn30Days: Math.round(current30DayPrediction * 100) / 100,
        });
      }
    }

    return predictions;
  }

  /**
   * Get user's weight change history (for charting)
   */
  async getWeightHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await this.prisma.progressMetric.findMany({
      where: {
        userId,
        metricDate: {
          gte: startDate,
        },
      },
      orderBy: {
        metricDate: 'asc',
      },
      select: {
        metricDate: true,
        weightKg: true,
      },
    });

    return metrics.map((m) => ({
      date: m.metricDate.toISOString().split('T')[0],
      weight: m.weightKg,
    }));
  }

  /**
   * Get calorie tracking history
   */
  async getCalorieHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await this.prisma.progressMetric.findMany({
      where: {
        userId,
        metricDate: {
          gte: startDate,
        },
      },
      orderBy: {
        metricDate: 'asc',
      },
      select: {
        metricDate: true,
        calorieTarget: true,
        calorieConsumed: true,
        calorieAdherencePercent: true,
      },
    });

    return metrics.map((m) => ({
      date: m.metricDate.toISOString().split('T')[0],
      target: m.calorieTarget,
      consumed: m.calorieConsumed,
      adherence: m.calorieAdherencePercent,
    }));
  }
}
