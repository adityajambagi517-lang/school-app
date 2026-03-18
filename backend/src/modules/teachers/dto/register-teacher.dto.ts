import { IsString, IsEmail, IsMongoId, IsOptional } from 'class-validator';

export class RegisterTeacherDto {
  @IsString()
  teacherId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsMongoId()
  assignedClassId?: string;

  @IsString()
  password: string;
}
