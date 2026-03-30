import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type FeeDocument = Fee & Document;

export enum FeeStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  PAID = 'PAID',
}

@Schema({ timestamps: true })
export class Fee {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  academicYear: string;

  @Prop({ required: true })
  termName: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true, enum: FeeStatus, default: FeeStatus.DRAFT })
  status: FeeStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EditRequest' })
  editRequestId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' })
  submittedBy: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  submittedAt: Date;

  @Prop()
  approvedAt: Date;

  @Prop()
  publishedAt: Date;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop()
  paidAt: Date;

  @Prop([{
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    proofUrl: { type: String }, // Path to receipt image
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: String },
    remarks: { type: String }
  }])
  payments: any[];
}

export const FeeSchema = SchemaFactory.createForClass(Fee);

// Indexes for efficient queries
FeeSchema.index({ studentId: 1, academicYear: 1 });
FeeSchema.index({ status: 1, isPaid: 1 });
