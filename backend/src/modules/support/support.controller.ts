import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async create(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.supportService.create({
      ...body,
      submittedBy: user.userId,
      submitterName: user.name,
      role: user.role,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.supportService.findAll();
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN)
  resolve(@Param('id') id: string, @Body('adminNotes') adminNotes: string) {
    return this.supportService.resolve(id, adminNotes);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
