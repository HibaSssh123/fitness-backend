import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type LLMProvider = 'groq' | 'openai' | 'gemini';

interface UserContext {
  name: string;
  age: string | null;
  currentWeight: number | null;
  goal: {
    type: string;
    targetWeight: number | null;
    calorieTarget: number;
  } | null;
  todayNutrition: {
    caloriesConsumed: number;
    proteinConsumed: number;
    calorieTarget: number | null;
    proteinTarget: number | null;
  };
  recentWorkoutCount: number;
}

@Injectable()
export class ChatbotService {
  private llmProvider: LLMProvider;
  private apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const provider = this.configService.get<string>('LLM_PROVIDER') || 'groq';
    this.llmProvider = provider.toLowerCase() as LLMProvider;
    this.apiKey = this.configService.get<string>('LLM_API_KEY') || 'demo-key';
  }

  /**
   * Get user context for the chatbot
   */
  private async getUserContext(userId: string): Promise<UserContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Get latest weight
    const latestWeight = await this.prisma.progressMetric.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { weightKg: true },
    });

    // Get active goal
    const activeGoal = await this.prisma.goal.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    // Get today's nutrition
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const foodLogs = await this.prisma.foodLog.findMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { food: true },
    });

    let todayCalories = 0;
    let todayProtein = 0;
    foodLogs.forEach((log) => {
      const multiplier = log.serving || 1;
      todayCalories += (log.food.calories || 0) * multiplier;
      todayProtein += (log.food.protein || 0) * multiplier;
    });

    // Get recent workouts
    const recentWorkouts = await this.prisma.workout.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return {
      name: user.name || 'User',
      age: user.height ? `${user.height}cm tall` : null,
      currentWeight: latestWeight?.weightKg || user.weight || null,
      goal: activeGoal
        ? {
            type: activeGoal.type,
            targetWeight: activeGoal.targetWeightKg,
            calorieTarget: activeGoal.targetCalories,
          }
        : null,
      todayNutrition: {
        caloriesConsumed: todayCalories,
        proteinConsumed: todayProtein,
        calorieTarget: user.calorieTarget,
        proteinTarget: user.proteinTarget,
      },
      recentWorkoutCount: recentWorkouts.length,
    };
  }

  /**
   * Create a system prompt with user context
   */
  private createSystemPrompt(userContext: UserContext | null): string {
    if (!userContext) {
      return 'You are an AI fitness coach. Provide helpful fitness and nutrition advice.';
    }

    return `
You are an AI fitness coach. You have access to the user's information:
- Name: ${userContext.name}
- Height: ${userContext.age || 'Unknown'}
- Current Weight: ${userContext.currentWeight ? `${userContext.currentWeight}kg` : 'Not set'}
- Goal: ${userContext.goal ? `${userContext.goal.type} (Target: ${userContext.goal.targetWeight}kg, ${userContext.goal.calorieTarget} calories)` : 'No active goal'}
- Today's Nutrition: ${userContext.todayNutrition.caloriesConsumed} calories consumed (Target: ${userContext.todayNutrition.calorieTarget}), ${userContext.todayNutrition.proteinConsumed}g protein (Target: ${userContext.todayNutrition.proteinTarget}g)
- Recent Activity: ${userContext.recentWorkoutCount} workouts in recent history

Provide personalized fitness and nutrition advice based on their data. Be encouraging and supportive.
`;
  }

  /**
   * Generate a demo response (for development without API keys)
   */
  private generateDemoResponse(): string {
    const responses = [
      'Great question! Based on your fitness data, I recommend staying consistent with your workouts and maintaining a balanced diet. Remember, progress takes time and dedication!',
      "That's a smart approach to your fitness goals. Make sure to track your macros closely and adjust your calorie intake based on your progress. You're doing great!",
      "I appreciate your commitment to fitness. Keep up with your training routine and don't forget to rest and recover properly. Consistency is key to success!",
      'Excellent effort! Your dedication to your fitness journey is inspiring. Remember to fuel your body with nutritious foods and stay hydrated throughout the day.',
      "Based on your recent activity, you're on a great track! Keep pushing towards your goals and celebrate the small wins along the way.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(
    userId: string,
    userMessage: string,
  ): Promise<Record<string, unknown>> {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // Get user context
    const userContext = await this.getUserContext(userId);

    // Save user message
    await this.prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: userMessage,
        metadata: userContext ? JSON.stringify(userContext) : null,
      },
    });

    // Generate response (using demo for now)
    const assistantResponse = this.generateDemoResponse();

    // Save assistant response
    const savedAssistantMessage = await this.prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: assistantResponse,
      },
    });

    return {
      message: {
        id: savedAssistantMessage.id,
        role: 'assistant',
        content: assistantResponse,
        createdAt: savedAssistantMessage.createdAt,
      },
    };
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId: string, limit: number = 50) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(userId: string) {
    const deleted = await this.prisma.chatMessage.deleteMany({
      where: { userId },
    });

    return { deletedCount: deleted.count };
  }
}
