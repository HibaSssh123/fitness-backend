import { Type } from 'class-transformer';
import { MealType, ServingUnit } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFoodLogDto {
  @IsString()
  foodId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  serving?: number;

  @IsOptional()
  @IsEnum(ServingUnit)
  servingUnit?: ServingUnit;

  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @IsOptional()
  @IsDateString()
  date?: string;
}
