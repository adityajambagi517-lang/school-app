import { IsMongoId, IsString, IsNumber, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkMarkcardItemDto {
    @IsString()
    subject: string;

    @IsNumber()
    @Min(0)
    marks: number;

    @IsNumber()
    @Min(1)
    maxMarks: number;
}

export class BulkCreateMarkcardDto {
    @IsMongoId()
    studentId: string;

    @IsMongoId()
    classId: string;

    @IsString()
    examType: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkMarkcardItemDto)
    marks: BulkMarkcardItemDto[];
}
