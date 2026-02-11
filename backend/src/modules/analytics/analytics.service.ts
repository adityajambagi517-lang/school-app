import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Markcard, MarkcardDocument, MarkcardStatus } from '../../schemas/markcard.schema';
import { Attendance, AttendanceDocument } from '../../schemas/attendance.schema';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { Fee, FeeDocument } from '../../schemas/fee.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Markcard.name) private markcardModel: Model<MarkcardDocument>,
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Fee.name) private feeModel: Model<FeeDocument>,
  ) { }

  /**
   * Class average for a subject and exam type
   * OPTIMIZED with MongoDB aggregation for large datasets
   */
  async getClassAverage(classId: string, subject: string, examType: string) {
    const result = await this.markcardModel.aggregate([
      {
        $match: {
          classId: new Types.ObjectId(classId),
          subject,
          examType,
          status: MarkcardStatus.PUBLISHED, // Only published marks
        },
      },
      {
        $group: {
          _id: null,
          averageMarks: { $avg: '$marks' },
          maxMarks: { $first: '$maxMarks' },
          totalStudents: { $sum: 1 },
          highestMarks: { $max: '$marks' },
          lowestMarks: { $min: '$marks' },
        },
      },
    ]);

    return result[0] || { averageMarks: 0, totalStudents: 0 };
  }

  /**
   * Compare performance across sections
   * OPTIMIZED for large-scale comparison
   */
  async compareSections(className: string, academicYear: string, subject: string, examType: string) {
    // Get all classes for this className and year
    const classes = await this.classModel.find({ className, academicYear });
    const classIds = classes.map(c => c._id);

    const result = await this.markcardModel.aggregate([
      {
        $match: {
          classId: { $in: classIds },
          subject,
          examType,
          status: MarkcardStatus.PUBLISHED,
        },
      },
      {
        $group: {
          _id: '$classId',
          averageMarks: { $avg: '$marks' },
          totalStudents: { $sum: 1 },
          highestMarks: { $max: '$marks' },
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: '_id',
          as: 'classInfo',
        },
      },
      {
        $unwind: '$classInfo',
      },
      {
        $project: {
          section: '$classInfo.section',
          averageMarks: 1,
          totalStudents: 1,
          highestMarks: 1,
        },
      },
      {
        $sort: { averageMarks: -1 },
      },
    ]);

    return result;
  }

  /**
   * Student performance overview
   */
  async getStudentPerformance(studentId: string) {
    const marks = await this.markcardModel.aggregate([
      {
        $match: {
          studentId: new Types.ObjectId(studentId),
          status: MarkcardStatus.PUBLISHED,
        },
      },
      {
        $group: {
          _id: {
            subject: '$subject',
            examType: '$examType',
          },
          marks: { $first: '$marks' },
          maxMarks: { $first: '$maxMarks' },
        },
      },
      {
        $project: {
          subject: '$_id.subject',
          examType: '$_id.examType',
          marks: 1,
          maxMarks: 1,
          percentage: {
            $multiply: [{ $divide: ['$marks', '$maxMarks'] }, 100],
          },
        },
      },
      {
        $sort: { subject: 1, examType: 1 },
      },
    ]);

    // Calculate overall average
    const overallAvg = marks.length > 0
      ? marks.reduce((sum, m) => sum + m.percentage, 0) / marks.length
      : 0;

    return {
      subjects: marks,
      overallAverage: overallAvg,
    };
  }

  /**
   * Attendance statistics for a class
   * OPTIMIZED with aggregation pipeline
   */
  async getClassAttendanceStats(classId: string, startDate: Date, endDate: Date) {
    const result = await this.attendanceModel.aggregate([
      {
        $match: {
          classId: new Types.ObjectId(classId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
      attendanceRate: 0,
    };

    result.forEach(item => {
      stats[item._id] = item.count;
      stats.total += item.count;
    });

    if (stats.total > 0) {
      stats.attendanceRate = (stats.present / stats.total * 100).toFixed(2) as any;
    }

    return stats;
  }

  /**
   * Student attendance percentage
   */
  async getStudentAttendanceRate(studentId: string, startDate: Date, endDate: Date) {
    const result = await this.attendanceModel.aggregate([
      {
        $match: {
          studentId: new Types.ObjectId(studentId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let present = 0;
    let total = 0;

    result.forEach(item => {
      total += item.count;
      if (item._id === 'present') present = item.count;
    });

    return {
      present,
      total,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
    };
  }

  /**
   * Student subject-wise attendance breakdown
   */
  async getStudentSubjectAttendance(studentId: string, startDate: Date, endDate: Date) {
    return this.attendanceModel.aggregate([
      {
        $match: {
          studentId: new Types.ObjectId(studentId),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$subjectId',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] },
          },
          total: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectInfo',
        },
      },
      {
        $project: {
          subjectId: '$_id',
          subjectName: {
            $ifNull: [{ $arrayElemAt: ['$subjectInfo.name', 0] }, 'General Attendance'],
          },
          present: 1,
          total: 1,
          attendanceRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $sort: { subjectName: 1 },
      },
    ]);
  }

  /**
   * Fee collection statistics
   */
  async getFeeCollectionStats(classId: string) {
    const students = await this.studentModel.find({ classId: new Types.ObjectId(classId) });
    const studentIds = students.map(s => s._id);

    const result = await this.feeModel.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
        },
      },
      {
        $group: {
          _id: '$isPaid',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const stats = {
      totalFees: 0,
      paidFees: 0,
      unpaidFees: 0,
      totalAmount: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      collectionRate: 0,
    };

    result.forEach(item => {
      if (item._id === true) {
        stats.paidFees = item.count;
        stats.collectedAmount = item.totalAmount;
      } else {
        stats.unpaidFees = item.count;
        stats.pendingAmount = item.totalAmount;
      }
      stats.totalAmount += item.totalAmount;
      stats.totalFees += item.count;
    });

    if (stats.totalAmount > 0) {
      stats.collectionRate = parseFloat(((stats.collectedAmount / stats.totalAmount) * 100).toFixed(2));
    }

    return stats;
  }

  /**
   * Dashboard statistics for admin
   */
  async getDashboardStats() {
    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      this.studentModel.countDocuments({ isActive: true }),
      this.classModel.countDocuments({ isActive: true }),
      this.classModel.countDocuments({ isActive: true }),
    ]);

    // Get today's attendance rate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceToday = await this.attendanceModel.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let presentToday = 0;
    let totalToday = 0;
    attendanceToday.forEach(item => {
      totalToday += item.count;
      if (item._id === 'present') presentToday = item.count;
    });

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceToday: {
        present: presentToday,
        total: totalToday,
        rate: totalToday > 0 ? ((presentToday / totalToday) * 100).toFixed(2) : 0,
      },
    };
  }
}
