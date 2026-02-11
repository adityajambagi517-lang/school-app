import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Markcard, MarkcardDocument } from '../../schemas/markcard.schema';
import { Fee, FeeDocument } from '../../schemas/fee.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CurrentUserData } from '../../decorators/current-user.decorator';

@Injectable()
export class StudentsService {
    constructor(
        @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
        @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Markcard.name) private markcardModel: Model<MarkcardDocument>,
        @InjectModel(Fee.name) private feeModel: Model<FeeDocument>,
        @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    ) { }

    async register(registerDto: any, user: CurrentUserData) {
        // For teachers, validate they're adding to their assigned class
        if (user.role === 'teacher' && user.referenceId) {
            const teacher = await this.teacherModel.findById(user.referenceId);
            if (!teacher) {
                throw new ForbiddenException('Teacher not found');
            }
            if (!teacher.assignedClassId) {
                throw new ForbiddenException('Teacher has no assigned class');
            }
            if (teacher.assignedClassId.toString() !== registerDto.classId) {
                throw new ForbiddenException('Teachers can only register students to their assigned class');
            }
        }

        // Check if student ID already exists
        const existingStudent = await this.studentModel.findOne({ studentId: registerDto.studentId });
        if (existingStudent) {
            throw new ConflictException('Student ID already exists');
        }

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ userId: registerDto.studentId });
        if (existingUser) {
            throw new ConflictException('User ID already exists');
        }

        // Create student
        const student = new this.studentModel({
            studentId: registerDto.studentId,
            name: registerDto.name,
            email: registerDto.email,
            classId: new Types.ObjectId(registerDto.classId),
            dateOfBirth: new Date(registerDto.dateOfBirth),
            gender: registerDto.gender,
            guardianName: registerDto.guardianName,
            guardianPhone: registerDto.guardianPhone,
            address: registerDto.address,
            isActive: true,
        });
        const savedStudent = await student.save();

        try {
            // Create user account
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            const userAccount = new this.userModel({
                userId: registerDto.studentId,
                password: hashedPassword,
                role: 'student',
                email: registerDto.email,
                name: registerDto.name,
                referenceId: savedStudent._id,
                referenceModel: 'Student',
                isActive: true,
            });
            await userAccount.save();

            return {
                success: true,
                message: 'Student registered successfully',
                student: savedStudent,
            };
        } catch (error) {
            // Rollback: Delete student if user creation fails
            await this.studentModel.findByIdAndDelete(savedStudent._id);
            throw error;
        }
    }

    async create(createStudentDto: CreateStudentDto, user: CurrentUserData) {
        // For teachers, validate they're adding to their assigned class
        if (user.role === 'teacher' && user.referenceId) {
            const teacher = await this.teacherModel.findById(user.referenceId);
            if (!teacher) {
                throw new ForbiddenException('Teacher not found');
            }
            if (teacher.assignedClassId.toString() !== createStudentDto.classId) {
                throw new ForbiddenException('Teachers can only add students to their assigned class');
            }
        }

        // Check if student ID already exists
        const existing = await this.studentModel.findOne({ studentId: createStudentDto.studentId });
        if (existing) {
            throw new ConflictException('Student ID already exists');
        }

        const student = new this.studentModel({
            ...createStudentDto,
            classId: new Types.ObjectId(createStudentDto.classId),
            dateOfBirth: new Date(createStudentDto.dateOfBirth),
        });

        return student.save();
    }

    async findAll(page: number = 1, limit: number = 50) {
        const skip = (page - 1) * limit;

        const [students, total] = await Promise.all([
            this.studentModel
                .find()
                .populate('classId', 'className section')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.studentModel.countDocuments(),
        ]);

        return {
            students,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: string) {
        const student = await this.studentModel
            .findById(id)
            .populate('classId', 'className section academicYear');

        if (!student) {
            throw new NotFoundException('Student not found');
        }
        return student;
    }

    async findByStudentId(studentId: string) {
        const student = await this.studentModel
            .findOne({ studentId })
            .populate('classId', 'className section academicYear');

        if (!student) {
            throw new NotFoundException('Student not found');
        }
        return student;
    }

    async search(query: string) {
        if (!query || query.trim() === '') {
            throw new NotFoundException('Search query is required');
        }

        // Search by student ID or name (case-insensitive)
        const students = await this.studentModel
            .find({
                $or: [
                    { studentId: { $regex: query, $options: 'i' } },
                    { name: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            })
            .populate('classId', 'className section academicYear')
            .limit(20)
            .exec();

        // Get comprehensive data for each student
        const studentsWithDetails = await Promise.all(
            students.map(async (student) => {
                const studentId = student._id;

                // Get marks
                const marks = await this.markcardModel
                    .find({ studentId, status: 'PUBLISHED' })
                    .select('subject examType marks maxMarks')
                    .exec();

                // Get attendance stats
                const totalAttendance = await this.attendanceModel.countDocuments({ studentId });
                const presentDays = await this.attendanceModel.countDocuments({
                    studentId,
                    status: 'present'
                });
                const attendancePercentage = totalAttendance > 0
                    ? Math.round((presentDays / totalAttendance) * 100)
                    : 0;

                // Get fee status
                const fees = await this.feeModel
                    .find({ studentId })
                    .select('termName amount dueDate isPaid')
                    .exec();

                const pendingFees = fees.filter(f => !f.isPaid);
                const totalPending = pendingFees.reduce((sum, f) => sum + f.amount, 0);

                return {
                    ...student.toObject(),
                    academicData: {
                        marks: marks.map(m => ({
                            subject: m.subject,
                            examType: m.examType,
                            marks: m.marks,
                            maxMarks: m.maxMarks,
                            percentage: Math.round((m.marks / m.maxMarks) * 100)
                        })),
                        attendance: {
                            totalDays: totalAttendance,
                            presentDays,
                            percentage: attendancePercentage
                        },
                        fees: {
                            total: fees.length,
                            paid: fees.filter(f => f.isPaid).length,
                            pending: pendingFees.length,
                            pendingAmount: totalPending,
                            details: fees.map(f => ({
                                term: f.termName,
                                amount: f.amount,
                                dueDate: f.dueDate,
                                isPaid: f.isPaid
                            }))
                        }
                    }
                };
            })
        );

        return {
            query,
            count: studentsWithDetails.length,
            students: studentsWithDetails
        };
    }

    async findByClass(classId: string, user: CurrentUserData) {
        // For teachers, verify they can only access their assigned class
        if (user.role === 'teacher' && user.referenceId) {
            const teacher = await this.teacherModel.findById(user.referenceId);
            if (!teacher) {
                throw new ForbiddenException('Teacher not found');
            }
            if (teacher.assignedClassId?.toString() !== classId) {
                throw new ForbiddenException('You can only access students from your assigned class');
            }
        }

        return this.studentModel
            .find({ classId: new Types.ObjectId(classId), isActive: true })
            .populate('classId', 'className section academicYear')
            .sort({ name: 1 })
            .exec();
    }

    async update(id: string, updateStudentDto: UpdateStudentDto) {
        const student = await this.studentModel
            .findByIdAndUpdate(id, updateStudentDto, { new: true })
            .populate('classId', 'className section');

        if (!student) {
            throw new NotFoundException('Student not found');
        }
        return student;
    }

    async updateProfileImage(id: string, imageUrl: string) {
        const student = await this.studentModel.findByIdAndUpdate(
            id,
            { profileImage: imageUrl },
            { new: true },
        );

        if (!student) {
            throw new NotFoundException('Student not found');
        }
        return student;
    }

    async remove(id: string, user: CurrentUserData) {
        const student = await this.studentModel.findById(id);

        if (!student) {
            throw new NotFoundException('Student not found');
        }

        // For teachers, validate they're deleting from their assigned class
        if (user.role === 'teacher' && user.referenceId) {
            const teacher = await this.teacherModel.findById(user.referenceId);
            if (!teacher) {
                throw new ForbiddenException('Teacher not found');
            }
            if (teacher.assignedClassId?.toString() !== student.classId.toString()) {
                throw new ForbiddenException('Teachers can only delete students from their assigned class');
            }
        }

        await this.studentModel.findByIdAndUpdate(id, { isActive: false });
        return { message: 'Student deactivated successfully' };
    }
}
