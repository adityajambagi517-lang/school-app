import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type TimetableDocument = Timetable & Document;

@Schema({ timestamps: true })
export class Timetable {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true })
  classId: Types.ObjectId;

  @Prop({ required: true, min: 0, max: 6 })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  @Prop({ required: true })
  period: number;

  @Prop({ required: true })
  subject: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true })
  teacherId: Types.ObjectId;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;
}

export const TimetableSchema = SchemaFactory.createForClass(Timetable);

// Compound index for efficient class timetable queries
TimetableSchema.index({ classId: 1, dayOfWeek: 1, period: 1 });
