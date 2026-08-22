import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.categories.findAll(user.id, includeArchived === 'true');
  }

  @Post()
  create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }

  @Patch(':id/unarchive')
  unarchive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.categories.unarchive(user.id, id);
  }

  @Delete(':id')
  archive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.categories.archive(user.id, id);
  }
}
