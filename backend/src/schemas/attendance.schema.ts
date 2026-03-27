import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type AttendanceDocument = Attendance & Document;

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true })
  classId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: Date;

  @Prop({ required: true, enum: AttendanceStatus })
  status: AttendanceStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true })
  markedBy: Types.ObjectId;

  @Prop()
  remarks: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Compound index for efficient queries
AttendanceSchema.index({ classId: 1, date: 1 });
AttendanceSchema.index({ studentId: 1, date: 1 });
