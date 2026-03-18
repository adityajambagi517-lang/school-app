import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  eventDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }], default: [] })
  targetClasses: Types.ObjectId[]; // Empty array means for all classes

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Index for date-based event queries
EventSchema.index({ eventDate: 1, isActive: 1 });
