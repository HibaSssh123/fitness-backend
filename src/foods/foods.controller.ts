import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFoodDto } from './dto/create-food.dto';
import { FoodsService } from './foods.service';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('foods')
@UseGuards(JwtAuthGuard)
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // POST /foods
  @Post()
  create(@Req() req: AuthedRequest, @Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.create(req.user.sub, createFoodDto);
  }

  @Get()
  list(@Query('search') search?: string) {
    return this.foodsService.list(search);
  }
}
