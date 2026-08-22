import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() findAll(@CurrentUser() user: CurrentUserData) { return this.categories.findAll(user.id); }
  @Post() create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCategoryDto) { return this.categories.create(user.id, dto); }
  @Delete(':id') archive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) { return this.categories.archive(user.id, id); }
}
