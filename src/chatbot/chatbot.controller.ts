import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { CreateChatMessageDto } from './chatbot.dto';

type AuthedRequest = Request & { user: { sub: string } };

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Send a message to the fitness chatbot
   * POST /chat
   * Body: { message: "Should I eat more protein?" }
   */
  @Post()
  async sendMessage(
    @Req() req: AuthedRequest,
    @Body() createChatMessageDto: CreateChatMessageDto,
  ) {
    return this.chatbotService.sendMessage(
      req.user.sub,
      createChatMessageDto.message,
    );
  }

  /**
   * Get conversation history
   * GET /chat/history?limit=50
   */
  @Get('history')
  async getHistory(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatbotService.getConversationHistory(req.user.sub, limitNum);
  }

  /**
   * Clear conversation history
   * DELETE /chat/history
   */
  @Delete('history')
  async clearHistory(@Req() req: AuthedRequest) {
    return this.chatbotService.clearConversationHistory(req.user.sub);
  }
}
