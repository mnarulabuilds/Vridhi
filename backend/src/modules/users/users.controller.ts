import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorator/current-user.decorator';
import type { CurrentUserData } from '../../common/interfaces/current-user.interface';
import { UsersService, toPublicProfile } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConfirmPasswordDto } from '../auth/dto/password.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    const record = await this.users.findById(user.id);
    if (!record) return user;
    return toPublicProfile(record);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: CurrentUserData, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('me/export')
  export(@CurrentUser() user: CurrentUserData) {
    return this.users.exportData(user.id);
  }

  @Delete('me')
  remove(@CurrentUser() user: CurrentUserData, @Body() dto: ConfirmPasswordDto) {
    return this.users.deleteAccount(user.id, dto.password);
  }
}
