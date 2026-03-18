import {
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsMongoId,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../../../schemas/attendance.schema';

export class CreateAttendanceDto {
  @IsMongoId()
  classId: string;

  @IsMongoId()
  studentId: string;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsMongoId()
  subjectId: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceItemDto {
  @IsMongoId()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkCreateAttendanceDto {
  @IsMongoId()
  classId: string;

  @IsDateString()
  date: string;

  @IsMongoId()
  subjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  attendances: BulkAttendanceItemDto[];
}
