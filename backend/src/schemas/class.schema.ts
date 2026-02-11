import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema({ timestamps: true })
export class Class {
    @Prop({ required: true })
    className: string;

    @Prop({ required: true })
    section: string;

    @Prop({ type: Types.ObjectId, ref: 'Teacher' })
    classTeacherId: Types.ObjectId;

    @Prop({ required: true })
    academicYear: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);

// Add compound index for unique class+section per year
ClassSchema.index({ className: 1, section: 1, academicYear: 1 }, { unique: true });
