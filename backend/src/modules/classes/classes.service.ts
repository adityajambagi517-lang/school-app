import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
    constructor(
        @InjectModel(Class.name) private classModel: Model<ClassDocument>,
        @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    ) { }

    async create(createClassDto: CreateClassDto) {
        const classDoc = new this.classModel(createClassDto);
        const savedClass = await classDoc.save();

        // If teacher is assigned during creation, update teacher record
        if (createClassDto.classTeacherId) {
            await this.teacherModel.findByIdAndUpdate(
                createClassDto.classTeacherId,
                { assignedClassId: savedClass._id }
            );
        }

        return savedClass;
    }

    async findAll() {
        return this.classModel
            .find()
            .populate('classTeacherId', 'name')
            .sort({ className: 1, section: 1 })
            .exec();
    }

    async findOne(id: string) {
        const classDoc = await this.classModel.findById(id).populate('classTeacherId', 'name');
        if (!classDoc) {
            throw new NotFoundException('Class not found');
        }
        return classDoc;
    }

    async findByTeacher(teacherId: string) {
        return this.classModel.find({ classTeacherId: teacherId }).exec();
    }

    async assignTeacher(classId: string, teacherId: string) {
        // Find the class
        const classDoc = await this.classModel.findById(classId);
        if (!classDoc) {
            throw new NotFoundException('Class not found');
        }

        // Find the teacher (optional - can be empty string to unassign)
        if (teacherId) {
            const teacher = await this.teacherModel.findById(teacherId);
            if (!teacher) {
                throw new NotFoundException('Teacher not found');
            }

            // If teacher is already assigned to another class, unassign from old class
            if (teacher.assignedClassId && teacher.assignedClassId.toString() !== classId) {
                await this.classModel.findByIdAndUpdate(
                    teacher.assignedClassId,
                    { $unset: { classTeacherId: '' } }
                );
            }

            // Update teacher's assignedClassId
            teacher.assignedClassId = classDoc._id as any;
            await teacher.save();
        }

        // If class already has a teacher, remove that teacher's assignment
        if (classDoc.classTeacherId) {
            await this.teacherModel.findByIdAndUpdate(
                classDoc.classTeacherId,
                { $unset: { assignedClassId: '' } }
            );
        }

        // Update class's classTeacherId
        if (teacherId) {
            classDoc.classTeacherId = teacherId as any;
        } else {
            classDoc.classTeacherId = undefined;
        }

        await classDoc.save();

        // Return updated class with populated teacher
        return this.classModel.findById(classId).populate('classTeacherId', 'name teacherId');
    }

    async remove(id: string) {
        const classDoc = await this.classModel.findById(id);
        if (!classDoc) {
            throw new NotFoundException('Class not found');
        }

        // If class has a teacher, clear that teacher's assignment
        if (classDoc.classTeacherId) {
            await this.teacherModel.findByIdAndUpdate(
                classDoc.classTeacherId,
                { $unset: { assignedClassId: '' } }
            );
        }

        const result = await this.classModel.findByIdAndDelete(id);
        return { message: 'Class deleted successfully', class: result };
    }
}
