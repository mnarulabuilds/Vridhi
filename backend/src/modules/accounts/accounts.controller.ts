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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AccountsService } from './accounts.service';

import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';

@Controller('api/v1/accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.accountsService.findOne(
      user.id,
      id,
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(
      user.id,
      id,
      dto,
    );
  }

  @Patch(':id/archive')
  archive(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.accountsService.archive(
      user.id,
      id,
    );
  }
}