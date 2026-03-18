import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationRecipientRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  recipientId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationRecipientRole })
  recipientRole: NotificationRecipientRole;

  @Prop({ required: true })
  type: string; // e.g., 'approval_pending', 'approved', 'rejected', etc.

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    type: {
      type: String,
      id: Types.ObjectId,
    },
  })
  relatedEntity: {
    type: string;
    id: Types.ObjectId;
  };

  @Prop({ default: false, index: true })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound index for user's unread notifications
NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
