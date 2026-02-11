import { IsMongoId, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';

export class CreateMarkcardDto {
    @IsMongoId()
    studentId: string;

    @IsMongoId()
    classId: string;

    @IsString()
    subject: string;

    @IsString()
    examType: string;

    @IsNumber()
    @Min(0)
    marks: number;

    @IsNumber()
    @Min(1)
    maxMarks: number;
}
