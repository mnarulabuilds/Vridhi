import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { ImportsService } from './imports.service';
import { CommitImportDto } from './dto/commit-import.dto';

@ApiTags('imports')
@ApiBearerAuth()
@Controller('api/v1/imports')
@UseGuards(JwtAuthGuard)
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Post('preview')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  preview(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('CSV file is required');
    }
    return this.imports.preview(file.buffer);
  }

  @Post('commit')
  @ApiBody({ type: Object })
  commit(@CurrentUser() user: CurrentUserData, @Body() dto: CommitImportDto) {
    return this.imports.commit(user.id, dto);
  }
}
