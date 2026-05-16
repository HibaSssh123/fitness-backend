import { Type } from 'class-transformer';
import {
  IsDateString,
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
  @IsDateString()
  date?: string;
}
