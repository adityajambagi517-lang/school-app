import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { MarkcardsModule } from './modules/markcards/markcards.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { FeesModule } from './modules/fees/fees.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { ClassesModule } from './modules/classes/classes.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NoticesModule } from './modules/notices/notices.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection using environment variables
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Connection options
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),

    AuthModule,

    AttendanceModule,

    MarkcardsModule,

    HomeworkModule,

    TimetableModule,

    FeesModule,

    AnalyticsModule,

    UsersModule,

    StudentsModule,

    ClassesModule,

    TeachersModule,

    SubjectsModule,
    NotificationsModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
