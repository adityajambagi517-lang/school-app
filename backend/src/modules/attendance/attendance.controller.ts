import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  BulkCreateAttendanceDto,
} from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.attendanceService.create(
      createAttendanceDto,
      user.userId,
      user.role,
      user.referenceId || '',
    );
  }

  @Post('bulk')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  bulkCreate(
    @Body() bulkDto: BulkCreateAttendanceDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.attendanceService.bulkCreate(
      bulkDto,
      user.userId,
      user.role,
      user.referenceId || '',
    );
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  findByClass(
    @Param('classId') classId: string,
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.attendanceService.findByClass(
      classId,
      date,
      user.role,
      user.referenceId || '',
    );
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER)
  findByStudent(@Param('studentId') studentId: string) {
    return this.attendanceService.findByStudent(studentId);
  }

  @Get('history/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  getHistory(
    @Param('classId') classId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.attendanceService.getHistoryByClass(
      classId,
      user.role,
      user.referenceId || '',
    );
  }
}
