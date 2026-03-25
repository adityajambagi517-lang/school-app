import { IsString, IsEmail, IsMongoId, IsOptional } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  teacherId: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsMongoId()
  assignedClassId?: string;
}
