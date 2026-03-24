import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Fee, FeeDocument, FeeStatus } from '../../schemas/fee.schema';
import {
  EditRequest,
  EditRequestDocument,
  EditRequestStatus,
  EditRequestType,
  EntityType,
} from '../../schemas/edit-request.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { Student, StudentDocument } from '../../schemas/student.schema';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UserRole } from '../../schemas/user.schema';

@Injectable()
export class FeesService {
  constructor(
    @InjectModel(Fee.name) private feeModel: Model<FeeDocument>,
    @InjectModel(EditRequest.name)
    private editRequestModel: Model<EditRequestDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
  ) {}

  /**
   * DRAFT: Teacher/Admin creates fee record
   */
  async create(
    createFeeDto: CreateFeeDto,
    userRole: string,
    referenceId: string,
  ) {
    // Verify student exists
    const student = await this.studentModel.findById(createFeeDto.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // For teachers, verify they manage this student's class
    if (userRole === UserRole.TEACHER) {
      const classModel = this.teacherModel.db.model('Class');
      const isAssigned = await classModel.exists({
        _id: student.classId,
        classTeacherId: referenceId
      });
      if (!isAssigned) {
        throw new ForbiddenException(
          'You can only manage fees for students in your assigned class',
        );
      }
    }

    const fee = new this.feeModel({
      ...createFeeDto,
      studentId: new Types.ObjectId(createFeeDto.studentId),
      dueDate: new Date(createFeeDto.dueDate),
      status: FeeStatus.DRAFT,
      submittedBy: new Types.ObjectId(referenceId),
      isPaid: false,
    });

    return fee.save();
  }

  /**
   * SUBMITTED: Submit fee for admin approval
   */
  async submitForApproval(id: string, userRole: string, referenceId: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    if (fee.status !== FeeStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT fees can be submitted');
    }

    // Verify ownership for teachers
    if (
      userRole === UserRole.TEACHER &&
      fee.submittedBy.toString() !== referenceId
    ) {
      throw new ForbiddenException('You can only submit your own fee records');
    }

    // Create edit request
    const editRequest = new this.editRequestModel({
      entityType: EntityType.FEES,
      entityId: fee._id,
      requestType: EditRequestType.CREATE,
      newData: fee.toObject(),
      requestedBy: new Types.ObjectId(referenceId),
      status: EditRequestStatus.PENDING,
    });
    await editRequest.save();

    fee.status = FeeStatus.SUBMITTED;
    fee.editRequestId = editRequest._id;
    fee.submittedAt = new Date();
    return fee.save();
  }

  /**
   * APPROVED: Admin approves fee
   */
  async approveFee(editRequestId: string, userId: string, comments: string) {
    const editRequest = await this.editRequestModel.findById(editRequestId);
    if (!editRequest || editRequest.entityType !== EntityType.FEES) {
      throw new NotFoundException('Edit request not found');
    }

    if (editRequest.status !== EditRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    editRequest.status = EditRequestStatus.APPROVED;
    editRequest.reviewedBy = new Types.ObjectId(userId);
    editRequest.reviewedAt = new Date();
    editRequest.reviewComments = comments;
    await editRequest.save();

    const fee = await this.feeModel.findById(editRequest.entityId);
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    fee.status = FeeStatus.APPROVED;
    fee.approvedBy = new Types.ObjectId(userId);
    fee.approvedAt = new Date();
    await fee.save();

    return { message: 'Fee approved successfully' };
  }

  /**
   * PUBLISHED: Admin publishes approved fees (visible to students/parents)
   */
  async publishFee(id: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    if (fee.status !== FeeStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED fees can be published');
    }

    fee.status = FeeStatus.PUBLISHED;
    fee.publishedAt = new Date();
    return fee.save();
  }

  /**
   * Mark fee as paid
   */
  async markAsPaid(id: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    fee.isPaid = true;
    fee.paidAt = new Date();
    return fee.save();
  }

  /**
   * Student views their own published fees
   */
  async getStudentFees(studentId: string) {
    return this.feeModel
      .find({
        studentId: new Types.ObjectId(studentId),
        status: FeeStatus.PUBLISHED,
      })
      .sort({ dueDate: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Admin/Teacher get all pending fee approvals
   */
  async getPendingApprovals() {
    return this.editRequestModel
      .find({
        entityType: EntityType.FEES,
        status: EditRequestStatus.PENDING,
      })
      .populate('requestedBy', 'userId name')
      .sort({ requestedAt: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Get fees by class (for teacher/admin)
   */
  async getFeesByClass(classId: string, userRole: string, referenceId: string) {
    if (userRole === UserRole.TEACHER) {
      const classModel = this.teacherModel.db.model('Class');
      const isAssigned = await classModel.exists({
        _id: classId,
        classTeacherId: referenceId
      });
      if (!isAssigned) {
        throw new ForbiddenException('Access denied');
      }
    }

    const students = await this.studentModel.find({
      classId: new Types.ObjectId(classId),
    });
    const studentIds = students.map((s) => s._id);

    return this.feeModel
      .find({ studentId: { $in: studentIds } })
      .populate('studentId', 'studentId name')
      .sort({ dueDate: -1 })
      .limit(200)
      .exec();
  }
}
