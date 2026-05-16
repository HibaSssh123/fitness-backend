import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodDto } from './dto/create-food.dto';

@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, createFoodDto: CreateFoodDto) {
    return this.prisma.food.create({
      data: {
        name: createFoodDto.name,
        calories: createFoodDto.calories,
        protein: createFoodDto.protein,
        carbs: createFoodDto.carbs,
        fat: createFoodDto.fat,
        defaultServingUnit: createFoodDto.servingUnit ?? 'SERVING',
        createdById: userId,
      },
    });
  }

  list(search?: string) {
    return this.prisma.food.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
