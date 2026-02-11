import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HomeworkDocument = Homework & Document;

export enum AssignmentType {
    ALL_STUDENTS = 'ALL_STUDENTS',
    INDIVIDUAL = 'INDIVIDUAL',
}

@Schema({ timestamps: true })
export class Homework {
    @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
    classId: Types.ObjectId;

    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
    assignedBy: Types.ObjectId;

    @Prop({ type: String, enum: AssignmentType, default: AssignmentType.ALL_STUDENTS })
    assignmentType: AssignmentType;

    @Prop({ type: Types.ObjectId, ref: 'Student', index: true })
    studentId?: Types.ObjectId;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);

// Index for efficient class-based queries
HomeworkSchema.index({ classId: 1, dueDate: 1 });
HomeworkSchema.index({ studentId: 1, dueDate: 1 });
