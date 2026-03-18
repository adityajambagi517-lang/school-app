import { IsString, IsEmail, IsMongoId, IsOptional } from 'class-validator';

export class CreateTeacherDto {
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
}
