import {
  IsMongoId,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  IsOptional,
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

  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @IsDateString()
  dueDate: string;
}
