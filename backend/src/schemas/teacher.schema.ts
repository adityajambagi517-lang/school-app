import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherDocument = Teacher & Document;

@Schema({ timestamps: true })
export class Teacher {
    @Prop({ required: true, unique: true, index: true })
    teacherId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ type: Types.ObjectId, ref: 'Class', index: true })
    assignedClassId?: Types.ObjectId;

    @Prop()
    subject?: string;

    @Prop()
    phone?: string;

    @Prop({ required: true })
    email: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);

// Add indexes
TeacherSchema.index({ teacherId: 1 }, { unique: true });
TeacherSchema.index({ assignedClassId: 1 });
