import { IsString, IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class CreateClassDto {
  @IsString()
  className: string;

  @IsString()
  section: string;

  @IsString()
  academicYear: string;

  @IsOptional()
  @IsMongoId()
  classTeacherId?: string;
}
