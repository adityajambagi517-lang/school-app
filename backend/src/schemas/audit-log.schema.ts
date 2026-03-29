import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: false })
export class AuditLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // e.g., 'CREATE_MARKS', 'APPROVE_REQUEST', etc.

  @Prop({ required: true })
  entityType: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldData: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newData: any;

  @Prop()
  ipAddress: string;

  @Prop({ default: () => new Date(), index: { expires: '30d' } })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for audit trail queries
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
