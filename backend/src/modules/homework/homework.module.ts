import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeworkService } from './homework.service';
import { HomeworkController } from './homework.controller';
import { Homework, HomeworkSchema } from '../../schemas/homework.schema';
import { Teacher, TeacherSchema } from '../../schemas/teacher.schema';
import { Notification, NotificationSchema } from '../../schemas/notification.schema';
import { Student, StudentSchema } from '../../schemas/student.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService, NotificationsService],
})
export class HomeworkModule { }
