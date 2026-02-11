import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Markcard, MarkcardSchema } from '../../schemas/markcard.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { Student, StudentSchema } from '../../schemas/student.schema';
import { Class, ClassSchema } from '../../schemas/class.schema';
import { Teacher, TeacherSchema } from '../../schemas/teacher.schema';
import { Fee, FeeSchema } from '../../schemas/fee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Markcard.name, schema: MarkcardSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: Fee.name, schema: FeeSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule { }
