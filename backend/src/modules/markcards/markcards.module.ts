import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarkcardsService } from './markcards.service';
import { MarkcardsController } from './markcards.controller';
import { Markcard, MarkcardSchema } from '../../schemas/markcard.schema';
import { EditRequest, EditRequestSchema } from '../../schemas/edit-request.schema';
import { Teacher, TeacherSchema } from '../../schemas/teacher.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Markcard.name, schema: MarkcardSchema },
      { name: EditRequest.name, schema: EditRequestSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [MarkcardsController],
  providers: [MarkcardsService],
})
export class MarkcardsModule { }
