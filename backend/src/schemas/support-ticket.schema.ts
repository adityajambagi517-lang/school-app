import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportTicketDocument = SupportTicket & Document;

export enum TicketCategory {
  PASSWORD_ISSUE = 'password_issue',
  BUG = 'bug',
  OTHER = 'other',
}

export enum TicketStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: TicketCategory, default: TicketCategory.OTHER })
  category: TicketCategory;

  @Prop({ required: false })
  screenshot?: string; // Base64 data URI

  @Prop({ required: true })
  submittedBy: string; // userId

  @Prop({ required: true })
  submitterName: string;

  @Prop({ required: true, enum: ['teacher', 'student'] })
  role: string;

  @Prop({ enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Prop({ required: false })
  adminNotes?: string;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
