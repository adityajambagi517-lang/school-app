import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
    ADMIN = 'admin',
    TEACHER = 'teacher',
    STUDENT = 'student',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, index: true })
    userId: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, enum: UserRole, index: true })
    role: UserRole;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    name: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, refPath: 'referenceModel' })
    referenceId: Types.ObjectId;

    @Prop({
        type: String,
        enum: ['Student', 'Teacher'],
        required: function () { return this.role !== UserRole.ADMIN; }
    })
    referenceModel: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ userId: 1 }, { unique: true });
UserSchema.index({ role: 1 });
