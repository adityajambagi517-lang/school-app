import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Attendance,
  AttendanceDocument,
} from '../../schemas/attendance.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import {
  CreateAttendanceDto,
  BulkCreateAttendanceDto,
} from './dto/create-attendance.dto';
import { UserRole } from '../../schemas/user.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
  ) {}

  async create(
    createAttendanceDto: CreateAttendanceDto,
    userId: string,
    userRole: string,
    referenceId: string,
  ) {
    // Verify teacher has access to this class
    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, createAttendanceDto.classId);
    }

    const attendance = new this.attendanceModel({
      ...createAttendanceDto,
      classId: new Types.ObjectId(createAttendanceDto.classId),
      studentId: new Types.ObjectId(createAttendanceDto.studentId),
      markedBy: new Types.ObjectId(referenceId),
      date: new Date(createAttendanceDto.date),
    });

    return attendance.save();
  }

  async bulkCreate(
    bulkDto: BulkCreateAttendanceDto,
    userId: string,
    userRole: string,
    referenceId: string,
  ) {
    // Verify teacher has access to this class
    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, bulkDto.classId);
    }

    const operations = bulkDto.attendances.map((att) => ({
      updateOne: {
        filter: {
          classId: new Types.ObjectId(bulkDto.classId),
          studentId: new Types.ObjectId(att.studentId),
          date: new Date(bulkDto.date)
        },
        update: {
          $set: {
            status: att.status,
            remarks: att.remarks,
            markedBy: new Types.ObjectId(referenceId)
          }
        },
        upsert: true
      }
    }));

    return this.attendanceModel.bulkWrite(operations);
  }

  async findByClass(
    classId: string,
    date: string,
    userRole: string,
    referenceId: string,
  ) {
    // Verify access
    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, classId);
    }

    return this.attendanceModel
      .find({
        classId: new Types.ObjectId(classId),
        date: new Date(date),
      })
      .populate('studentId', 'name studentId')
      .exec();
  }

  async findByStudent(studentId: string) {
    return this.attendanceModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ date: -1 })
      .limit(50)
      .exec();
  }

  private async verifyTeacherAccess(teacherId: string, classId: string) {
    const classModel = this.teacherModel.db.model('Class');
    const isAssigned = await classModel.exists({ 
      _id: classId, 
      classTeacherId: teacherId 
    });

    if (!isAssigned) {
      throw new ForbiddenException(
        'You can only manage attendance for your assigned class',
      );
    }
  }
}
