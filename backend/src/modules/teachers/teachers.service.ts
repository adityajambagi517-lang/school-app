import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
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
  ) {}

  async register(registerDto: any) {
    // Check if teacher ID already exists
    const existingTeacher = await this.teacherModel.findOne({
      teacherId: registerDto.teacherId,
    });
    if (existingTeacher) {
      throw new ConflictException('Teacher ID already exists');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      userId: registerDto.teacherId,
    });
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
    if (registerDto.profilePicture) {
      teacherData.profilePicture = registerDto.profilePicture;
    }
    
    if (registerDto.assignedClassId) {
      // Check if the class is already assigned to ANY teacher
      const existingAssignment = await this.classModel.findOne({
        _id: registerDto.assignedClassId,
        classTeacherId: { $exists: true, $ne: null }
      });
      
      if (existingAssignment && existingAssignment.classTeacherId) {
        throw new ConflictException(`This class is already assigned to another teacher.`);
      }
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
        phone: registerDto.phone,
        profilePicture: registerDto.profilePicture,
        subject: registerDto.subject,
        referenceId: savedTeacher._id,
        referenceModel: 'Teacher',
        isActive: true,
      });
      await user.save();

      // Synchronize Class document: give it this new teacher's ID
      if (registerDto.assignedClassId) {
        await this.classModel.findByIdAndUpdate(registerDto.assignedClassId, {
          classTeacherId: savedTeacher._id
        });
      }

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
    const teachers = await this.teacherModel.find().lean().exec();
    return Promise.all(teachers.map(async (t) => {
      const classes = await this.classModel.find({ classTeacherId: t._id }, 'className section academicYear').lean().exec();
      return { ...t, assignedClasses: classes };
    }));
  }

  async search(query: string) {
    const regex = new RegExp(query, 'i');
    const teachers = await this.teacherModel
      .find({
        $or: [{ name: regex }, { email: regex }, { teacherId: regex }],
      })
      .limit(8)
      .lean()
      .exec();

    return Promise.all(teachers.map(async (t) => {
      const classes = await this.classModel.find({ classTeacherId: t._id }, 'className section academicYear').lean().exec();
      return { ...t, assignedClasses: classes };
    }));
  }

  async findAllWithStats() {
    const teachers = await this.teacherModel.find().lean().exec();

    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const assignedClasses = await this.classModel.find({ classTeacherId: teacher._id }).lean().exec();

        if (!assignedClasses || assignedClasses.length === 0) {
          return {
            ...teacher,
            assignedClasses: [],
            stats: {
              studentCount: 0,
              averageMarks: 0,
              attendanceRate: 0,
            },
          };
        }

        let totalStudents = 0;
        for (const cls of assignedClasses) {
          totalStudents += await this.studentModel.countDocuments({ classId: cls._id });
        }

        return {
          ...teacher,
          assignedClasses,
          stats: {
             studentCount: totalStudents,
             averageMarks: 0,
             attendanceRate: 0,
          }
        };
      })
    );

    return teachersWithStats;
  }

  async findOne(id: string) {
    const teacher = await this.teacherModel.findById(id).lean().exec();
    if (!teacher) throw new NotFoundException('Teacher not found');

    const assignedClasses = await this.classModel.find({ classTeacherId: teacher._id }).lean().exec();
    return { ...teacher, assignedClasses };
  }

  async create(createTeacherDto: any) {
    const teacher = new this.teacherModel(createTeacherDto);
    return teacher.save();
  }

  async update(id: string, updateTeacherDto: any) {
    const teacher = await this.teacherModel.findByIdAndUpdate(id, updateTeacherDto, { new: true }).exec();
    if (teacher) {
      // Sync basic info to the linked user account
      const syncFields: any = {};
      if (updateTeacherDto.name) syncFields.name = updateTeacherDto.name;
      if (updateTeacherDto.email) syncFields.email = updateTeacherDto.email;
      if (updateTeacherDto.phone !== undefined) syncFields.phone = updateTeacherDto.phone;
      if (updateTeacherDto.profilePicture) syncFields.profilePicture = updateTeacherDto.profilePicture;

      if (Object.keys(syncFields).length > 0) {
        await this.userModel.findOneAndUpdate(
          { userId: teacher.teacherId, role: 'teacher' },
          { $set: syncFields }
        );
      }
    }
    return teacher;
  }

  async updateProfileImage(id: string, imageUrl: string) {
    const teacher = await this.teacherModel.findByIdAndUpdate(
      id,
      { profilePicture: imageUrl },
      { new: true },
    );

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Update the linked user account as well
    await this.userModel.findOneAndUpdate(
      { userId: teacher.teacherId, role: 'teacher' },
      { profilePicture: imageUrl }
    );

    return teacher;
  }

  async assignClass(teacherId: string, classId: string) {
    if (!classId) {
      // If unassigning all classes is intended, we'd need a specific route,
      // but if an empty classId came in, we just ignore or return bad request.
      throw new ConflictException('Class ID is required to assign');
    }

    // Check if the class is already assigned to ANOTHER teacher
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) {
       throw new NotFoundException('Class not found');
    }
    
    if (classDoc.classTeacherId && classDoc.classTeacherId.toString() !== teacherId) {
       const existingTeacher = await this.teacherModel.findById(classDoc.classTeacherId);
       if (existingTeacher) {
          throw new ConflictException(`This class is already assigned to ${existingTeacher.name} (${existingTeacher.teacherId})`);
       }
    }

    // Assign the teacher to this class
    await this.classModel.findByIdAndUpdate(classId, { classTeacherId: teacherId });

    return this.teacherModel.findById(teacherId).exec();
  }

  async remove(id: string) {
    const teacher = await this.teacherModel.findById(id);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // If teacher is assigned to any distinct classes, clear the classTeacherId from those classes
    await this.classModel.updateMany(
      { classTeacherId: teacher._id },
      { $unset: { classTeacherId: '' } }
    );

    // Delete associated user account
    await this.userModel.findOneAndDelete({
      userId: teacher.teacherId,
      role: 'teacher',
    });

    // Hard delete the teacher record
    return this.teacherModel.findByIdAndDelete(id);
  }
}
