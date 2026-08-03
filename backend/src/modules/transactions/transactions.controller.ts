import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';

import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { type CurrentUserData } from 'src/common/interfaces/current-user.interface';

@Controller('/api/v1/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(
      user.id,
      dto,
    );
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.transactionsService.findAll(
      user.id,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.transactionsService.findOne(
      user.id,
      id,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(
      user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.transactionsService.remove(
      user.id,
      id,
    );
  }
}