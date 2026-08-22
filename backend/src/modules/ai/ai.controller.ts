import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('conversations')
  conversations(@CurrentUser() user: CurrentUserData) {
    return this.ai.listConversations(user.id);
  }

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  chat(@CurrentUser() user: CurrentUserData, @Body() dto: ChatDto) {
    return this.ai.chat(user.id, dto);
  }
}
