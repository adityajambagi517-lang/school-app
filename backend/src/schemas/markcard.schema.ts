import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type MarkcardDocument = Markcard & Document;

export enum MarkcardStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

@Schema({ timestamps: true })
export class Markcard {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true })
  classId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  examType: string; // e.g., "Mid-term", "Final", etc.

  @Prop({ required: true })
  marks: number;

  @Prop({ required: true })
  maxMarks: number;

  @Prop({
    required: true,
    enum: MarkcardStatus,
    default: MarkcardStatus.DRAFT,
    index: true,
  })
  status: MarkcardStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'EditRequest' })
  editRequestId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true })
  submittedBy: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop()
  submittedAt: Date;

  @Prop()
  approvedAt: Date;

  @Prop()
  publishedAt: Date;
}

export const MarkcardSchema = SchemaFactory.createForClass(Markcard);

// Compound indexes for efficient queries
MarkcardSchema.index({ studentId: 1, status: 1 });
MarkcardSchema.index({ classId: 1, examType: 1 });
MarkcardSchema.index({ status: 1, submittedBy: 1 });
