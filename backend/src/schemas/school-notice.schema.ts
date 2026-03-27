import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from './user.schema';

export type SchoolNoticeDocument = SchoolNotice & Document;

@Schema({ timestamps: true })
export class SchoolNotice {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: [String], enum: UserRole, required: true })
  targetRoles: UserRole[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, expires: 0, required: true })
  expiresAt: Date;
}

export const SchoolNoticeSchema = SchemaFactory.createForClass(SchoolNotice);
