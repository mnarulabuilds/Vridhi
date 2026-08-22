import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, includeArchived = false) {
    return this.prisma.category.findMany({
      where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
      orderBy: [{ isArchived: 'asc' }, { type: 'asc' }, { name: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({ data: { ...dto, name: dto.name.trim(), userId } });
    } catch (error: any) {
      if (error.code === 'P2002') throw new ConflictException('Category already exists');
      throw error;
    }
  }

  async archive(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId, isArchived: false } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: { isArchived: true } });
  }

  async unarchive(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId, isArchived: true } });
    if (!category) throw new NotFoundException('Archived category not found');
    return this.prisma.category.update({ where: { id }, data: { isArchived: false } });
  }
}
