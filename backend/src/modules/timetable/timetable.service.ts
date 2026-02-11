import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Timetable, TimetableDocument } from '../../schemas/timetable.schema';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(
    @InjectModel(Timetable.name) private timetableModel: Model<TimetableDocument>,
  ) { }

  async create(createTimetableDto: CreateTimetableDto) {
    const timetable = new this.timetableModel({
      ...createTimetableDto,
      classId: new Types.ObjectId(createTimetableDto.classId),
      teacherId: new Types.ObjectId(createTimetableDto.teacherId),
    });

    return timetable.save();
  }

  async findByClass(classId: string) {
    return this.timetableModel
      .find({ classId: new Types.ObjectId(classId) })
      .populate('teacherId', 'name')
      .sort({ dayOfWeek: 1, period: 1 })
      .exec();
  }

  async update(id: string, updateTimetableDto: UpdateTimetableDto) {
    return this.timetableModel.findByIdAndUpdate(id, updateTimetableDto, { new: true });
  }

  async remove(id: string) {
    return this.timetableModel.findByIdAndDelete(id);
  }
}
