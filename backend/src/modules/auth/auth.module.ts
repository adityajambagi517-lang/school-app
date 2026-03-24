import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileController } from './profile.controller';
import { JwtStrategy } from './jwt.strategy';
import { ForgotPasswordService } from './forgot-password.service';
import { EmailService } from '../../services/email.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Student, StudentSchema } from '../../schemas/student.schema';
import { Teacher, TeacherSchema } from '../../schemas/teacher.schema';
import { Otp, OtpSchema } from '../../schemas/otp.schema';
import { Class, ClassSchema } from '../../schemas/class.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' as any },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [AuthController, ProfileController],
  providers: [AuthService, JwtStrategy, ForgotPasswordService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
