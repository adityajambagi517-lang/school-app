import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
    @Prop({ required: true, unique: true, index: true })
    studentId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
    classId: Types.ObjectId;

    @Prop({ required: true })
    dateOfBirth: Date;

    @Prop({ required: true })
    gender: string;

    @Prop()
    phone?: string;

    @Prop({ required: true })
    guardianName: string;

    @Prop({ required: true })
    guardianPhone: string;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    profileImage?: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

// Add indexes
StudentSchema.index({ studentId: 1 }, { unique: true });
StudentSchema.index({ classId: 1 });
