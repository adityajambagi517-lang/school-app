import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(
    @Body() createSubjectDto: CreateSubjectDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.subjectsService.create(
      createSubjectDto,
      user.role,
      user.referenceId || '',
    );
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('classId') classId?: string,
  ) {
    return this.subjectsService.findAll(user.role, user.referenceId || '', classId);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.subjectsService.findOne(id, user.role, user.referenceId || '');
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.subjectsService.update(
      id,
      updateSubjectDto,
      user.role,
      user.referenceId || '',
    );
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.subjectsService.remove(id, user.role, user.referenceId || '');
  }
}
