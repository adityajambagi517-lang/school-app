import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Homework, HomeworkDocument } from '../../schemas/homework.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { UserRole } from '../../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientRole } from '../../schemas/notification.schema';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectModel(Homework.name) private homeworkModel: Model<HomeworkDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    createHomeworkDto: CreateHomeworkDto,
    userRole: string,
    referenceId: string,
  ) {
    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, createHomeworkDto.classId);
    }

    const homeworkData: any = {
      ...createHomeworkDto,
      classId: new Types.ObjectId(createHomeworkDto.classId),
      assignedBy: new Types.ObjectId(referenceId),
      dueDate: new Date(createHomeworkDto.dueDate),
    };

    // Handle individual student assignment
    if (createHomeworkDto.studentId) {
      homeworkData.studentId = new Types.ObjectId(createHomeworkDto.studentId);
    }

    const homework = new this.homeworkModel(homeworkData);
    const savedHomework = await homework.save();

    // Send notifications to students
    await this.sendHomeworkNotifications(
      savedHomework,
      createHomeworkDto.classId,
    );

    return savedHomework;
  }

  async findByClass(classId: string, userRole: string, referenceId: string) {
    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, classId);
    }

    return this.homeworkModel
      .find({ classId: new Types.ObjectId(classId) })
      .sort({ dueDate: -1 })
      .limit(50)
      .exec();
  }

  async update(
    id: string,
    updateHomeworkDto: UpdateHomeworkDto,
    userRole: string,
    referenceId: string,
  ) {
    const homework = await this.homeworkModel.findById(id);
    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    if (userRole === UserRole.TEACHER) {
      await this.verifyTeacherAccess(referenceId, homework.classId.toString());
      if (homework.assignedBy.toString() !== referenceId) {
        throw new ForbiddenException('You can only update your own homework');
      }
    }

    Object.assign(homework, updateHomeworkDto);
    return homework.save();
  }

  async remove(id: string, userRole: string, referenceId: string) {
    const homework = await this.homeworkModel.findById(id);
    if (!homework) {
      throw new NotFoundException('Homework not found');
    }

    if (userRole === UserRole.TEACHER) {
      if (homework.assignedBy.toString() !== referenceId) {
        throw new ForbiddenException('You can only delete your own homework');
      }
    }

    return this.homeworkModel.findByIdAndDelete(id);
  }

  private async verifyTeacherAccess(teacherId: string, classId: string) {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.assignedClassId.toString() !== classId) {
      throw new ForbiddenException(
        'You can only manage homework for your assigned class',
      );
    }
  }

  private async sendHomeworkNotifications(homework: any, classId: string) {
    try {
      // Fetch all students in the class
      const students = await this.studentModel.find({
        classId: new Types.ObjectId(classId),
      });

      // Create notifications for each student
      const notificationPromises = students.map((student) =>
        this.notificationsService.create({
          recipientId: student._id,
          recipientRole: NotificationRecipientRole.STUDENT,
          type: 'homework_assigned',
          title: 'New Homework Assigned',
          message: `New homework "${homework.title}" has been assigned for ${homework.subject}. Due date: ${new Date(homework.dueDate).toLocaleDateString()}`,
          relatedEntity: {
            type: 'Homework',
            id: homework._id,
          },
        }),
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to send homework notifications:', error);
      // Don't throw error - homework creation should succeed even if notifications fail
    }
  }
}
