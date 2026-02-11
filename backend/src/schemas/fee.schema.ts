import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeeDocument = Fee & Document;

export enum FeeStatus {
    DRAFT = 'DRAFT',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    PUBLISHED = 'PUBLISHED',
}

@Schema({ timestamps: true })
export class Fee {
    @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true })
    studentId: Types.ObjectId;

    @Prop({ required: true })
    academicYear: string;

    @Prop({ required: true })
    termName: string; // e.g., "Term 1", "Term 2"

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({ required: true, enum: FeeStatus, default: FeeStatus.DRAFT })
    status: FeeStatus;

    @Prop({ type: Types.ObjectId, ref: 'EditRequest' })
    editRequestId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Teacher' })
    submittedBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    approvedBy: Types.ObjectId;

    @Prop()
    submittedAt: Date;

    @Prop()
    approvedAt: Date;

    @Prop()
    publishedAt: Date;

    @Prop({ default: false })
    isPaid: boolean;

    @Prop()
    paidAt: Date;
}

export const FeeSchema = SchemaFactory.createForClass(Fee);

// Indexes for efficient queries
FeeSchema.index({ studentId: 1, academicYear: 1 });
FeeSchema.index({ status: 1, isPaid: 1 });
