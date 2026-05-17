import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with optional filters
   */
  async getUsers(page = 1, limit = 10, role?: 'USER' | 'ADMIN') {
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          height: true,
          weight: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get analytics for dashboard
   */
  async getAnalytics() {
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      totalGoals,
      activeGoals,
      totalWorkouts,
      totalFoodLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.goal.count(),
      this.prisma.goal.count({ where: { isActive: true } }),
      this.prisma.workout.count(),
      this.prisma.foodLog.count(),
    ]);

    // Get trending exercises
    const trendingExercises = await this.prisma.workoutExercise.groupBy({
      by: ['exerciseId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get exercise details for trending exercises
    const exerciseIds = trendingExercises.map((e) => e.exerciseId);
    const exercises = await this.prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
      select: { id: true, name: true },
    });

    const exerciseMap = new Map(exercises.map((e) => [e.id, e.name]));
    const trendingList = trendingExercises.map((e) => ({
      exerciseId: e.exerciseId,
      exerciseName: exerciseMap.get(e.exerciseId),
      count: e._count.id,
    }));

    // Get user progress statistics
    const latestProgressMetrics = await this.prisma.progressMetric.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        calorieAdherencePercent: true,
        goalProgressPercent: true,
      },
    });

    const avgCalorieAdherence =
      latestProgressMetrics.length > 0
        ? latestProgressMetrics.reduce(
            (sum, m) => sum + (m.calorieAdherencePercent || 0),
            0,
          ) / latestProgressMetrics.length
        : 0;

    const avgGoalProgress =
      latestProgressMetrics.length > 0
        ? latestProgressMetrics.reduce(
            (sum, m) => sum + (m.goalProgressPercent || 0),
            0,
          ) / latestProgressMetrics.length
        : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: totalAdmins,
      },
      goals: {
        total: totalGoals,
        active: activeGoals,
      },
      activities: {
        totalWorkouts,
        totalFoodLogs,
      },
      trendingExercises: trendingList,
      userProgress: {
        avgCalorieAdherence: Math.round(avgCalorieAdherence * 100) / 100,
        avgGoalProgress: Math.round(avgGoalProgress * 100) / 100,
      },
    };
  }

  /**
   * Ban/unban a user
   */
  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        role: true,
      },
    });
  }

  /**
   * Delete a user and all their data
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin users');
    }

    // Cascade delete is handled by Prisma
    const deletedUser = await this.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return { message: 'User deleted successfully', user: deletedUser };
  }

  /**
   * Promote a user to admin
   */
  async promoteToAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('User is already an admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  /**
   * Demote an admin to user
   */
  async demoteFromAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: 'USER' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }
}
