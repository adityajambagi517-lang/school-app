import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from '../../schemas/subject.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { UserRole } from '../../schemas/user.schema';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
  ) {}

  async create(
    createSubjectDto: CreateSubjectDto,
    userRole: string,
    referenceId: string,
  ) {
    // Get teacher's assigned class
    const teacher = await this.teacherModel.findById(referenceId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const classModel = this.teacherModel.db.model('Class');
    const assignedClasses = await classModel.find({ classTeacherId: teacher._id }).lean().exec();

    if (!assignedClasses || assignedClasses.length === 0) {
      throw new ForbiddenException(
        'You must have an assigned class to create subjects',
      );
    }

    const subject = new this.subjectModel({
      ...createSubjectDto,
      teacherId: new Types.ObjectId(referenceId),
      classId: assignedClasses[0]._id,
    });

    return subject.save();
  }

  async findAll(userRole: string, referenceId: string) {
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.teacherModel.findById(referenceId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // If teacher is assigned to a class, let them see all subjects for that class
      // This is needed for bulk marks entry where class teacher enters marks for all subjects
      const classModel = this.teacherModel.db.model('Class');
      const assignedClasses = await classModel.find({ classTeacherId: teacher._id }).lean().exec();
      
      if (assignedClasses && assignedClasses.length > 0) {
        const classIds = assignedClasses.map(c => c._id as Types.ObjectId);
        return this.subjectModel
          .find({
            classId: { $in: classIds },
            isActive: true,
          })
          .sort({ name: 1 })
          .exec();
      }

      // Otherwise just their own subjects
      return this.subjectModel
        .find({
          teacherId: new Types.ObjectId(referenceId),
          isActive: true,
        })
        .sort({ createdAt: -1 })
        .exec();
    }

    // Admin can see all subjects
    return this.subjectModel
      .find({ isActive: true })
      .populate('teacherId', 'name teacherId')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userRole: string, referenceId: string) {
    const subject = await this.subjectModel.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Teachers can only view their own subjects
    if (
      userRole === UserRole.TEACHER &&
      subject.teacherId.toString() !== referenceId
    ) {
      throw new ForbiddenException('You can only view your own subjects');
    }

    return subject;
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    userRole: string,
    referenceId: string,
  ) {
    const subject = await this.subjectModel.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Teachers can only update their own subjects
    if (
      userRole === UserRole.TEACHER &&
      subject.teacherId.toString() !== referenceId
    ) {
      throw new ForbiddenException('You can only update your own subjects');
    }

    Object.assign(subject, updateSubjectDto);
    return subject.save();
  }

  async remove(id: string, userRole: string, referenceId: string) {
    const subject = await this.subjectModel.findById(id);
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Teachers can only delete their own subjects
    if (
      userRole === UserRole.TEACHER &&
      subject.teacherId.toString() !== referenceId
    ) {
      throw new ForbiddenException('You can only delete your own subjects');
    }

    // Soft delete
    subject.isActive = false;
    return subject.save();
  }
}
