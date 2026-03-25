import { IsString, IsEmail, IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class RegisterStudentDto {
  @IsString()
  studentId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  gender: string;

  @IsString()
  guardianName: string;

  @IsString()
  guardianPhone: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  address: string;

  @IsMongoId()
  classId: string;

  @IsString()
  password: string;
}
