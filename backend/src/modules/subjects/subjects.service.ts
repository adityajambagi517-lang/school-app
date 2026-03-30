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

    let targetClassId = assignedClasses[0]._id;
    if (createSubjectDto.classId) {
       const isValid = assignedClasses.some(c => c._id.toString() === createSubjectDto.classId);
       if (!isValid) throw new ForbiddenException('Invalid class assigned');
       targetClassId = new Types.ObjectId(createSubjectDto.classId);
    }

    const { classId, ...dtoWithoutClassId } = createSubjectDto as any;

    const subject = new this.subjectModel({
      ...dtoWithoutClassId,
      teacherId: new Types.ObjectId(referenceId),
      classId: targetClassId,
    });

    return subject.save();
  }

  async findAll(userRole: string, referenceId: string, classId?: string) {
    if (userRole === UserRole.TEACHER) {
      const teacher = await this.teacherModel.findById(referenceId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const classModel = this.teacherModel.db.model('Class');
      const assignedClasses = await classModel.find({ classTeacherId: teacher._id }).lean().exec();
      
      if (assignedClasses && assignedClasses.length > 0) {
        const assignedClassIds = assignedClasses.map(c => c._id.toString());
        
        // If specific classId requested, verify teacher has access
        if (classId) {
          if (!assignedClassIds.includes(classId)) {
            throw new ForbiddenException('You are not assigned to this class');
          }
          return this.subjectModel
            .find({ classId: new Types.ObjectId(classId), isActive: true })
            .sort({ name: 1 })
            .exec();
        }

        // Default: return subjects for all assigned classes
        const classObjectIds = assignedClasses.map(c => c._id as Types.ObjectId);
        return this.subjectModel
          .find({
            classId: { $in: classObjectIds },
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

    // Admin can see all subjects, filter by classId if provided
    const query: any = { isActive: true };
    if (classId) {
      query.classId = new Types.ObjectId(classId);
    }

    return this.subjectModel
      .find(query)
      .populate('teacherId', 'name teacherId')
      .populate('classId', 'className section') // Populating className and section for better admin visibility
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
