import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { LoginDto, LoginResponse } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { userId, password } = loginDto;

    // Find user by userId
    const user = await this.userModel.findOne({ userId, isActive: true });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create JWT payload - role comes from database, not frontend
    const payload = {
      userId: user.userId,
      _id: user._id.toString(),
      role: user.role,
      referenceId: user.referenceId?.toString(),
    };

    const access_token = this.jwtService.sign(payload);

    // Prepare full user profile
    const userResponse = await this.getUserProfile(user.userId);

    return {
      access_token,
      user: userResponse,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.userModel.findOne({ userId, isActive: true });
    if (!user) return null;

    const userResponse: any = {
      userId: user.userId,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      referenceId: user.referenceId?.toString(),
    };

    // If teacher, dynamically find associated classes from the Class collection
    if (user.role === 'teacher' && user.referenceId) {
      const teacher = await this.teacherModel.findById(user.referenceId);

      if (teacher) {
        userResponse.subject = teacher.subject;
        const assignedClasses = await this.classModel.find({ classTeacherId: teacher._id }).lean().exec();
        
        // Pass array of all classes for advanced components
        userResponse.assignedClasses = assignedClasses;

        // Calculate total students across all assigned classes
        if (assignedClasses.length > 0) {
          const classIds = assignedClasses.map(c => c._id);
          const studentCount = await this.studentModel.countDocuments({
            classId: { $in: classIds },
            isActive: true,
          });
          userResponse.totalStudents = studentCount;

          // Maintain backward compatibility...
          const primaryClass = assignedClasses[0];
          userResponse.assignedClassId = primaryClass._id.toString();
          userResponse.className = primaryClass.className;
          userResponse.section = primaryClass.section;
        }
      }
    }

    // If student, include studentDetails and class details
    if (user.role === 'student' && user.referenceId) {
      const student = await this.studentModel
        .findById(user.referenceId)
        .populate('classId');

      if (student) {
        userResponse.studentDetails = student.toObject();
      }
    }

    return userResponse;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userModel.findOne({ userId, isActive: true });
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ userId, isActive: true });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, updateDto: any): Promise<any> {
    const user = await this.userModel
      .findOneAndUpdate(
        { userId, isActive: true },
        { $set: updateDto },
        { new: true },
      )
      .select('-password');

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Sync shared fields to the Teacher / Student reference model
    let referenceId = user.referenceId;
    let referenceModelName = user.referenceModel;
    console.log(`[Sync] Updating profile for user: ${user.userId} (Role: ${user.role})`);

    // 1. ROBUST IDENTIFIER RESOLUTION (Fallback for legacy/stale accounts)
    if (user.role === UserRole.TEACHER) {
      // Always verify the reference record exists, or find it via TCH ID
      let teacherRecord = referenceId ? await this.teacherModel.findById(referenceId) : null;
      if (!teacherRecord) {
        console.log(`[Sync] referenceId lookup failed for teacher ${user.userId}, attempting fallback via teacherId...`);
        teacherRecord = await this.teacherModel.findOne({ teacherId: user.userId });
      }

      if (teacherRecord) {
        if (!referenceId || referenceId.toString() !== teacherRecord._id.toString()) {
          referenceId = teacherRecord._id as any;
          referenceModelName = 'Teacher';
          // SELF-HEALING: Update the user record's referenceId for future calls
          await this.userModel.findByIdAndUpdate(user._id, { referenceId, referenceModel: 'Teacher' });
          console.log(`[Sync] Self-healed referenceId for teacher ${user.userId} to ${referenceId}`);
        }

        // SYNC COMPLETE STATE FROM USER TO TEACHER
        const syncFields: any = {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          subject: (user as any).subject || ''
        };
        
        if (user.profilePicture) {
          syncFields.profilePicture = user.profilePicture;
          syncFields.profileImage = user.profilePicture;
        }

        if (updateDto.profilePicture !== undefined && teacherRecord.profilePicture) {
          // CLEANUP OLD IMAGE FILE (if it was a physical file path)
          const oldPic = teacherRecord.profilePicture;
          if (oldPic && !oldPic.startsWith('data:') && !oldPic.startsWith('http')) {
             const filePath = path.join(process.cwd(), 'uploads', oldPic.startsWith('/') ? oldPic.substring(1) : oldPic);
             if (fs.existsSync(filePath)) {
               try { fs.unlinkSync(filePath); console.log(`[Sync] Deleted old teacher image file: ${filePath}`); } catch (e) {}
             }
          }
        }

        if (Object.keys(syncFields).length > 0) {
          const syncResult = await this.teacherModel.findByIdAndUpdate(referenceId, { $set: syncFields }, { new: true });
          console.log(`[Sync] Teacher record fully synced: ${syncResult ? 'SUCCESS' : 'FAILED'} (Email: ${syncResult?.email}, Phone: ${syncResult?.phone})`);
        }
      } else {
        console.warn(`[Sync] ERROR: No Teacher record found matching teacherId: ${user.userId}`);
      }
    } else if (user.role === UserRole.STUDENT) {
      // Same logic for students
      let studentRecord = referenceId ? await this.studentModel.findById(referenceId) : null;
      if (!studentRecord) {
        console.log(`[Sync] referenceId lookup failed for student ${user.userId}, searching by studentId...`);
        studentRecord = await this.studentModel.findOne({ studentId: user.userId });
      }

      if (studentRecord) {
        if (!referenceId || referenceId.toString() !== studentRecord._id.toString()) {
          referenceId = studentRecord._id as any;
          referenceModelName = 'Student';
          await this.userModel.findByIdAndUpdate(user._id, { referenceId, referenceModel: 'Student' });
          console.log(`[Sync] Self-healed referenceId for student ${user.userId} to ${referenceId}`);
        }

        // SYNC COMPLETE STATE FROM USER TO STUDENT
        const syncFields: any = {
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        };

        if (user.profilePicture) {
          syncFields.profilePicture = user.profilePicture;
          syncFields.profileImage = user.profilePicture;
        }

        if (updateDto.profilePicture !== undefined) {
          const oldPic = (studentRecord as any).profileImage || (studentRecord as any).profilePicture;
          if (oldPic && !oldPic.startsWith('data:') && !oldPic.startsWith('http')) {
             const filePath = path.join(process.cwd(), 'uploads', oldPic.startsWith('/') ? oldPic.substring(1) : oldPic);
             if (fs.existsSync(filePath)) {
               try { fs.unlinkSync(filePath); console.log(`[Sync] Deleted old student image file: ${filePath}`); } catch (e) {}
             }
          }
        }

        if (Object.keys(syncFields).length > 0) {
          const syncResult = await this.studentModel.findByIdAndUpdate(referenceId, { $set: syncFields }, { new: true });
          console.log(`[Sync] Student record fully synced: ${syncResult ? 'SUCCESS' : 'FAILED'}`);
        }
      } else {
        console.warn(`[Sync] ERROR: No Student record found matching studentId: ${user.userId}`);
      }
    }

    return user;
  }
}
