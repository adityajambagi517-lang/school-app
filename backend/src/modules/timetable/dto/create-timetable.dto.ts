import { IsMongoId, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateTimetableDto {
  @IsMongoId()
  classId: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsNumber()
  period: number;

  @IsString()
  subject: string;

  @IsMongoId()
  teacherId: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}
