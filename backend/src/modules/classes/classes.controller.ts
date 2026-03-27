import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll() {
    return this.classesService.findAll();
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  search(@Query('q') q: string, @CurrentUser() user: any) {
    return this.classesService.search(q, user);
  }

  @Get('my-classes')
  @Roles(UserRole.TEACHER)
  findMyClasses(@CurrentUser() user: any) {
    return this.classesService.findByTeacher(user.referenceId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Patch(':id/assign-teacher')
  @Roles(UserRole.ADMIN)
  assignTeacher(
    @Param('id') id: string,
    @Body() assignTeacherDto: { teacherId: string },
  ) {
    return this.classesService.assignTeacher(id, assignTeacherDto.teacherId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
