import {
  IsMongoId,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { AssignmentType } from '../../../schemas/homework.schema';

export class CreateHomeworkDto {
  @IsMongoId()
  classId: string;

  @IsString()
  subject: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  dueDate: string;

  @IsEnum(AssignmentType)
  @IsOptional()
  assignmentType?: AssignmentType;

  @IsMongoId()
  @IsOptional()
  studentId?: string;
}
