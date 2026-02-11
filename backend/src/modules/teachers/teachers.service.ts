import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class TeachersService {
    constructor(
        @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
        @InjectModel(Class.name) private classModel: Model<ClassDocument>,
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async register(registerDto: any) {
        // Check if teacher ID already exists
        const existingTeacher = await this.teacherModel.findOne({ teacherId: registerDto.teacherId });
        if (existingTeacher) {
            throw new ConflictException('Teacher ID already exists');
        }

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ userId: registerDto.teacherId });
        if (existingUser) {
            throw new ConflictException('User ID already exists');
        }

        // Prepare teacher data
        const teacherData: any = {
            teacherId: registerDto.teacherId,
            name: registerDto.name,
            email: registerDto.email,
        };

        // Only add optional fields if they have values
        if (registerDto.phone) {
            teacherData.phone = registerDto.phone;
        }
        if (registerDto.subject) {
            teacherData.subject = registerDto.subject;
        }
        if (registerDto.assignedClassId) {
            teacherData.assignedClassId = registerDto.assignedClassId;
        }

        // Create teacher
        const teacher = new this.teacherModel(teacherData);
        const savedTeacher = await teacher.save();

        try {
            // Create user account
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            const user = new this.userModel({
                userId: registerDto.teacherId,
                password: hashedPassword,
                role: 'teacher',
                email: registerDto.email,
                name: registerDto.name,
                referenceId: savedTeacher._id,
                referenceModel: 'Teacher',
                isActive: true,
            });
            await user.save();

            return {
                success: true,
                message: 'Teacher registered successfully',
                teacher: savedTeacher,
            };
        } catch (error) {
            // Rollback: Delete teacher if user creation fails
            await this.teacherModel.findByIdAndDelete(savedTeacher._id);
            throw error;
        }
    }

    async findAll() {
        return this.teacherModel
            .find()
            .populate('assignedClassId', 'className section academicYear')
            .exec();
    }

    async findAllWithStats() {
        const teachers = await this.teacherModel
            .find()
            .populate('assignedClassId', 'className section academicYear')
            .lean()
            .exec();

        const teachersWithStats = await Promise.all(
            teachers.map(async (teacher) => {
                if (!teacher.assignedClassId) {
                    return {
                        ...teacher,
                        stats: {
                            studentCount: 0,
                            averageMarks: 0,
                            attendanceRate: 0,
                            className: 'Not Assigned',
                            section: '-',
                        },
                    };
                }

                const classId = teacher.assignedClassId._id;

                // Count students in the class
                const studentCount = await this.studentModel.countDocuments({ classId });

                // For now, return basic stats (marks and attendance can be added later)
                return {
                    ...teacher,
                    stats: {
                        studentCount,
                        averageMarks: 0, // Placeholder - can be calculated from markcards later
                        attendanceRate: 0, // Placeholder - can be calculated from attendance later
                        className: (teacher.assignedClassId as any).className,
                        section: (teacher.assignedClassId as any).section,
                        academicYear: (teacher.assignedClassId as any).academicYear,
                    },
                };
            }),
        );

        return teachersWithStats;
    }

    async findOne(id: string) {
        return this.teacherModel.findById(id).populate('assignedClassId').exec();
    }

    async create(createTeacherDto: any) {
        const teacher = new this.teacherModel(createTeacherDto);
        return teacher.save();
    }

    async update(id: string, updateTeacherDto: any) {
        return this.teacherModel
            .findByIdAndUpdate(id, updateTeacherDto, { new: true })
            .populate('assignedClassId')
            .exec();
    }

    async assignClass(teacherId: string, classId: string) {
        return this.teacherModel
            .findByIdAndUpdate(teacherId, { assignedClassId: classId }, { new: true })
            .populate('assignedClassId')
            .exec();
    }

    async remove(id: string) {
        const teacher = await this.teacherModel.findById(id);
        if (teacher && teacher.assignedClassId) {
            await this.classModel.findByIdAndUpdate(
                teacher.assignedClassId,
                { $unset: { classTeacherId: '' } }
            );
        }
        return this.teacherModel.findByIdAndDelete(id);
    }
}
