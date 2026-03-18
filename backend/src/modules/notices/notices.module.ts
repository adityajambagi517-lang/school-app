import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import {
  SchoolNotice,
  SchoolNoticeSchema,
} from '../../schemas/school-notice.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SchoolNotice.name, schema: SchoolNoticeSchema },
    ]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
