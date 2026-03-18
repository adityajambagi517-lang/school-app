import { IsMongoId } from 'class-validator';

export class AssignTeacherDto {
  @IsMongoId()
  teacherId: string;
}
