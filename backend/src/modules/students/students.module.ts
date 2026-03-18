import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from '../../schemas/student.schema';
import { Class, ClassSchema } from '../../schemas/class.schema';
import { Teacher, TeacherSchema } from '../../schemas/teacher.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Markcard, MarkcardSchema } from '../../schemas/markcard.schema';
import { Fee, FeeSchema } from '../../schemas/fee.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Class.name, schema: ClassSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: User.name, schema: UserSchema },
      { name: Markcard.name, schema: MarkcardSchema },
      { name: Fee.name, schema: FeeSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
