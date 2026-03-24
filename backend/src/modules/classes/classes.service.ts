import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    try {
      const classDoc = new this.classModel(createClassDto);
      const savedClass = await classDoc.save();

      // Since we rely entirely on classTeacherId, saving the class is enough!
      // The teacher will automatically be associated in queries.

      return savedClass;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Class ${createClassDto.className} Section ${createClassDto.section} already exists in this academic year.`);
      }
      throw error;
    }
  }

  async findAll() {
    return this.classModel
      .find()
      .populate('classTeacherId', 'name')
      .sort({ className: 1, section: 1 })
      .exec();
  }

  async search(query: string) {
    if (!query || query.trim() === '') return [];
    
    // Search by class name (e.g. "Class 10") or section (e.g. "A")
    return this.classModel
      .find({
        $or: [
          { className: { $regex: query, $options: 'i' } },
          { section: { $regex: query, $options: 'i' } },
        ]
      })
      .populate('classTeacherId', 'name')
      .limit(10)
      .exec();
  }

  async findOne(id: string) {
    const classDoc = await this.classModel
      .findById(id)
      .populate('classTeacherId', 'name');
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }
    return classDoc;
  }

  async findByTeacher(teacherId: string) {
    return this.classModel.find({ classTeacherId: teacherId }).exec();
  }

  async assignTeacher(classId: string, teacherId: string) {
    // Find the class
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // Find the teacher (optional - can be empty string to unassign)
    if (teacherId) {
      const teacher = await this.teacherModel.findById(teacherId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    // If class already has a teacher, we do nothing to the old teacher because 
    // we no longer store assignedClassId on the teacher document.

    // Update class's classTeacherId
    if (teacherId) {
      classDoc.classTeacherId = teacherId as any;
    } else {
      classDoc.classTeacherId = undefined;
    }

    await classDoc.save();

    // Return updated class with populated teacher
    return this.classModel
      .findById(classId)
      .populate('classTeacherId', 'name teacherId');
  }

  async remove(id: string) {
    const classDoc = await this.classModel.findById(id);
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    // We no longer need to update the Teacher document because the foreign key was removed.

    const result = await this.classModel.findByIdAndDelete(id);
    return { message: 'Class deleted successfully', class: result };
  }
}
