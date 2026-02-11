import { Controller, Get, UseGuards, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('class/:classId/average')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getClassAverage(
    @Param('classId') classId: string,
    @Query('subject') subject: string,
    @Query('examType') examType: string,
  ) {
    return this.analyticsService.getClassAverage(classId, subject, examType);
  }

  @Get('sections/compare')
  @Roles(UserRole.ADMIN)
  compareSections(
    @Query('className') className: string,
    @Query('academicYear') academicYear: string,
    @Query('subject') subject: string,
    @Query('examType') examType: string,
  ) {
    return this.analyticsService.compareSections(className, academicYear, subject, examType);
  }

  @Get('student/:studentId/performance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getStudentPerformance(@Param('studentId') studentId: string) {
    return this.analyticsService.getStudentPerformance(studentId);
  }

  @Get('class/:classId/attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getClassAttendanceStats(
    @Param('classId') classId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getClassAttendanceStats(classId, start, end);
  }

  @Get('student/:studentId/attendance-rate')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getStudentAttendanceRate(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getStudentAttendanceRate(studentId, start, end);
  }

  @Get('student/:studentId/subject-attendance')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  getStudentSubjectAttendance(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.analyticsService.getStudentSubjectAttendance(studentId, start, end);
  }

  @Get('class/:classId/fee-collection')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getFeeCollectionStats(@Param('classId') classId: string) {
    return this.analyticsService.getFeeCollectionStats(classId);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
