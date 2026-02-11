import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) { }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(@Body() createHomeworkDto: CreateHomeworkDto, @CurrentUser() user: CurrentUserData) {
    return this.homeworkService.create(createHomeworkDto, user.role, user.referenceId || '');
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN)
  findByClass(@Param('classId') classId: string, @CurrentUser() user: CurrentUserData) {
    return this.homeworkService.findByClass(classId, user.role, user.referenceId || '');
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateHomeworkDto: UpdateHomeworkDto, @CurrentUser() user: CurrentUserData) {
    return this.homeworkService.update(id, updateHomeworkDto, user.role, user.referenceId || '');
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.homeworkService.remove(id, user.role, user.referenceId || '');
  }
}
