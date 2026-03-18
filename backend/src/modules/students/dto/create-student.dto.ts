import {
  IsString,
  IsEmail,
  IsDateString,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateStudentDto {
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

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  guardianName: string;

  @IsString()
  guardianPhone: string;

  @IsString()
  address: string;

  @IsMongoId()
  classId: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
