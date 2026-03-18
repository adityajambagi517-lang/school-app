import {
  IsMongoId,
  IsNumber,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateFeeDto {
  @IsMongoId()
  studentId: string;

  @IsString()
  academicYear: string;

  @IsString()
  termName: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  dueDate: string;
}
