import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
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
        const assignedClasses = await this.classModel.find({ classTeacherId: teacher._id }).lean().exec();
        
        // Pass array of all classes for advanced components
        userResponse.assignedClasses = assignedClasses;

        // Maintain backward compatibility with the Teacher Dashboard by elevating the primary class
        if (assignedClasses.length > 0) {
          const primaryClass = assignedClasses[0];
          userResponse.assignedClassId = primaryClass._id.toString();
          userResponse.className = primaryClass.className;
          userResponse.section = primaryClass.section;

          // Get student count for this specific primary class
          const studentCount = await this.studentModel.countDocuments({
            classId: primaryClass._id,
            isActive: true,
          });
          userResponse.totalStudents = studentCount;
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

    return user;
  }
}
