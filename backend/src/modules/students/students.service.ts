import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { Markcard, MarkcardDocument } from '../../schemas/markcard.schema';
import { Fee, FeeDocument } from '../../schemas/fee.schema';
import {
  Attendance,
  AttendanceDocument,
} from '../../schemas/attendance.schema';
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
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
  ) {}

  async register(registerDto: any, user: CurrentUserData) {
    // For teachers, validate they're adding to their assigned class
    if (user.role === 'teacher' && user.referenceId) {
      const teacher = await this.teacherModel.findById(user.referenceId);
      if (!teacher) {
        throw new ForbiddenException('Teacher not found');
      }
      const isAssigned = await this.isTeacherAssignedToClass(user.referenceId, registerDto.classId);
      if (!isAssigned) {
        throw new ForbiddenException(
          'Teachers can only register students to their assigned classes',
        );
      }
    }

    // Check if student ID already exists
    const existingStudent = await this.studentModel.findOne({
      studentId: registerDto.studentId,
    });
    if (existingStudent) {
      throw new ConflictException('Student ID already exists');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      userId: registerDto.studentId,
    });
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
      profileImage: registerDto.profileImage,
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
        phone: registerDto.phone,
        profilePicture: registerDto.profileImage,
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
      const isAssigned = await this.isTeacherAssignedToClass(user.referenceId, createStudentDto.classId);
      if (!isAssigned) {
        throw new ForbiddenException(
          'Teachers can only add students to their assigned classes',
        );
      }
    }

    // Check if student ID already exists
    const existing = await this.studentModel.findOne({
      studentId: createStudentDto.studentId,
    });
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

  async search(query: string, user: CurrentUserData) {
    if (!query || query.trim() === '') {
      throw new NotFoundException('Search query is required');
    }

    const filter: any = {
      $or: [
        { studentId: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };

    // If teacher, restrict to their assigned class
    if (user.role === 'teacher' && user.referenceId) {
      const assignedClassIds = await this.getTeacherAssignedClassIds(user.referenceId);
      if (assignedClassIds.length === 0) {
        throw new ForbiddenException(
          'Teacher has no assigned class to search within',
        );
      }
      filter.classId = { $in: assignedClassIds };
    }

    // Search by student ID or name (case-insensitive) with class filter
    const students = await this.studentModel
      .find(filter)
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
        const totalAttendance = await this.attendanceModel.countDocuments({
          studentId,
        });
        const presentDays = await this.attendanceModel.countDocuments({
          studentId,
          status: 'present',
        });
        const attendancePercentage =
          totalAttendance > 0
            ? Math.round((presentDays / totalAttendance) * 100)
            : 0;

        // Get fee status
        const fees = await this.feeModel
          .find({ studentId })
          .select('termName amount dueDate isPaid')
          .exec();

        const pendingFees = fees.filter((f) => !f.isPaid);
        const totalPending = pendingFees.reduce((sum, f) => sum + f.amount, 0);

        return {
          ...student.toObject(),
          profileImage: student.profileImage || (student as any).profilePicture,
          academicData: {
            marks: marks.map((m) => ({
              subject: m.subject,
              examType: m.examType,
              marks: m.marks,
              maxMarks: m.maxMarks,
              percentage: Math.round((m.marks / m.maxMarks) * 100),
            })),
            attendance: {
              totalDays: totalAttendance,
              presentDays,
              percentage: attendancePercentage,
            },
            fees: {
              total: fees.length,
              paid: fees.filter((f) => f.isPaid).length,
              pending: pendingFees.length,
              pendingAmount: totalPending,
              details: fees.map((f) => ({
                term: f.termName,
                amount: f.amount,
                dueDate: f.dueDate,
                isPaid: f.isPaid,
              })),
            },
          },
        };
      }),
    );

    let teachers = [];
    if (user.role === 'admin') {
      teachers = await this.teacherModel
        .find({
          $or: [
            { teacherId: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
          ],
        })
        .limit(10)
        .exec();
    }

    return {
      query,
      count: studentsWithDetails.length + teachers.length,
      students: studentsWithDetails,
      teachers: teachers.map(t => ({
        ...t.toObject ? t.toObject() : t,
        profilePicture: t.profilePicture || (t as any).profileImage,
        profileImage: t.profileImage || (t as any).profilePicture,
      })),
    };
  }

  async findByClass(classId: string, user: CurrentUserData) {
    // For teachers, verify they can only access their assigned class
    if (user.role === 'teacher' && user.referenceId) {
      const teacher = await this.teacherModel.findById(user.referenceId);
      if (!teacher) {
        throw new ForbiddenException('Teacher not found');
      }
      const isAssigned = await this.isTeacherAssignedToClass(user.referenceId, classId);
      if (!isAssigned) {
        throw new ForbiddenException(
          'You can only access students from your assigned classes',
        );
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

    if (student) {
      // Sync basic info to the linked user account
      const syncFields: any = {};
      if (updateStudentDto.name) syncFields.name = updateStudentDto.name;
      if (updateStudentDto.email) syncFields.email = updateStudentDto.email;
      if (updateStudentDto.phone !== undefined) syncFields.phone = updateStudentDto.phone;
      if (updateStudentDto.profileImage) syncFields.profilePicture = updateStudentDto.profileImage;

      if (Object.keys(syncFields).length > 0) {
        await this.userModel.findOneAndUpdate(
          { userId: student.studentId, role: 'student' },
          { $set: syncFields }
        );
      }
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

    // Sync to the linked user account
    await this.userModel.findOneAndUpdate(
      { userId: student.studentId, role: 'student' },
      { profilePicture: imageUrl },
    );

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
      const isAssigned = await this.isTeacherAssignedToClass(user.referenceId, student.classId.toString());
      if (!isAssigned) {
        throw new ForbiddenException(
          'Teachers can only delete students from their assigned classes',
        );
      }
    }

    // Delete associated user account
    await this.userModel.findOneAndDelete({
      userId: student.studentId,
      role: 'student',
    });

    // Hard delete the student record
    await this.studentModel.findByIdAndDelete(id);

    return { message: 'Student and associated user account deleted successfully' };
  }
  private async getTeacherAssignedClassIds(teacherId: string): Promise<string[]> {
    const classModel = this.teacherModel.db.model('Class');
    const classes = await classModel.find({ classTeacherId: teacherId }).lean().exec();
    return classes.map(c => c._id.toString());
  }

  private async isTeacherAssignedToClass(teacherId: string, classId: string): Promise<boolean> {
    const classModel = this.teacherModel.db.model('Class');
    return !!(await classModel.exists({ _id: classId, classTeacherId: teacherId }));
  }
}
