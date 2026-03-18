import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type EditRequestDocument = EditRequest & Document;

export enum EditRequestType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REVALUATION = 'revaluation',
}

export enum EditRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EntityType {
  MARKS = 'marks',
  FEES = 'fees',
}

@Schema({ timestamps: true })
export class EditRequest {
  @Prop({ required: true, enum: EntityType, index: true })
  entityType: EntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ required: true, enum: EditRequestType })
  requestType: EditRequestType;

  @Prop({
    required: true,
    enum: EditRequestStatus,
    default: EditRequestStatus.PENDING,
    index: true,
  })
  status: EditRequestStatus;

  @Prop({ type: MongooseSchema.Types.Mixed })
  oldData: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  newData: any;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true })
  requestedBy: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class', index: true })
  classId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop({ default: () => new Date() })
  requestedAt: Date;

  @Prop()
  reviewedAt: Date;

  @Prop()
  reviewComments: string;
}

export const EditRequestSchema = SchemaFactory.createForClass(EditRequest);

// Compound indexes for efficient approval queue queries
EditRequestSchema.index({ status: 1, requestedBy: 1 });
EditRequestSchema.index({ entityType: 1, entityId: 1 });
EditRequestSchema.index({ status: 1, requestedAt: 1 });
