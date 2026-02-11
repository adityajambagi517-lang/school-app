import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) { }

    @Get('with-stats')
    @Roles(UserRole.ADMIN)
    findAllWithStats() {
        return this.teachersService.findAllWithStats();
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll() {
        return this.teachersService.findAll();
    }

    @Post('register')
    @Roles(UserRole.ADMIN)
    register(@Body() registerDto: RegisterTeacherDto) {
        return this.teachersService.register(registerDto);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createTeacherDto: any) {
        return this.teachersService.create(createTeacherDto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateTeacherDto: any) {
        return this.teachersService.update(id, updateTeacherDto);
    }

    @Patch(':id/assign-class')
    @Roles(UserRole.ADMIN)
    assignClass(@Param('id') id: string, @Body('classId') classId: string) {
        return this.teachersService.assignClass(id, classId);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    findOne(@Param('id') id: string) {
        return this.teachersService.findOne(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string) {
        return this.teachersService.remove(id);
    }
}
