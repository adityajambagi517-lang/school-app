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

    if (createFeeDto.paidAmount && createFeeDto.paidAmount >= createFeeDto.amount) {
      fee.isPaid = true;
      fee.status = FeeStatus.PAID;
      fee.paidAt = new Date();
    }

    return fee.save();
  }

  /**
   * Update DRAFT fee record
   */
  async update(id: string, updateData: any, userRole: string, referenceId: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) throw new NotFoundException('Fee not found');
    if (fee.status !== FeeStatus.DRAFT) throw new BadRequestException('Only DRAFT fees can be edited');

    if (userRole === UserRole.TEACHER && fee.submittedBy.toString() !== referenceId) {
      throw new ForbiddenException('You can only edit your own fee records');
    }

    Object.assign(fee, updateData);
    if (updateData.dueDate) fee.dueDate = new Date(updateData.dueDate);
    
    // Automatically set paid status if upfront payment covers the full amount
    if (fee.paidAmount && fee.paidAmount >= fee.amount) {
      fee.isPaid = true;
      fee.status = FeeStatus.PAID;
      fee.paidAt = new Date();
    }
    
    return fee.save();
  }

  /**
   * Delete DRAFT fee record
   */
  async delete(id: string, userRole: string, referenceId: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) throw new NotFoundException('Fee not found');
    if (fee.status !== FeeStatus.DRAFT) throw new BadRequestException('Only DRAFT fees can be deleted');

    if (userRole === UserRole.TEACHER && fee.submittedBy.toString() !== referenceId) {
      throw new ForbiddenException('You can only delete your own fee records');
    }

    await this.feeModel.findByIdAndDelete(id);
    return { success: true };
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

    // Get student to find classId
    const student = await this.studentModel.findById(fee.studentId);

    // Create edit request
    const editRequest = new this.editRequestModel({
      entityType: EntityType.FEES,
      entityId: fee._id,
      classId: student?.classId,
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
   * Mark fee as paid (Legacy full payment override)
   */
  async markAsPaid(id: string) {
    const fee = await this.feeModel.findById(id);
    if (!fee) {
      throw new NotFoundException('Fee not found');
    }

    fee.isPaid = true;
    fee.status = FeeStatus.PAID;
    fee.paidAmount = fee.amount;
    fee.paidAt = new Date();
    return fee.save();
  }

  /**
   * Record payment with proof (Teacher/Admin submits for approval)
   */
  async recordPaymentWithProof(
    feeId: string,
    amountPaid: number,
    userRole: string,
    referenceId: string,
    proofUrl?: string,
    transactionId?: string,
    remarks?: string,
  ) {
    const fee = await this.feeModel.findById(feeId);
    if (!fee) throw new NotFoundException('Fee record not found');

    // Create a payment object (PENDING)
    const payment = {
      _id: new Types.ObjectId(),
      amount: amountPaid,
      proofUrl,
      transactionId,
      remarks,
      submittedBy: new Types.ObjectId(referenceId),
      status: 'PENDING',
      paidAt: new Date(),
    };

    fee.payments.push(payment);
    await fee.save();

    // Create an EditRequest for this payment to show up in Admin Approval Board
    // We'll use the 'newData' to store which payment index/id is being approved
    const student = await this.studentModel.findById(fee.studentId);
    const editRequest = new this.editRequestModel({
      entityType: EntityType.FEES,
      entityId: fee._id,
      classId: student?.classId,
      requestType: EditRequestType.UPDATE, // Using update for payment approval
      newData: {
        paymentId: payment._id,
        amount: amountPaid,
        proofUrl,
        type: 'PAYMENT_APPROVAL',
      },
      requestedBy: new Types.ObjectId(referenceId),
      status: EditRequestStatus.PENDING,
    });
    await editRequest.save();

    return { message: 'Payment recorded and submitted for approval', paymentId: payment._id };
  }

  /**
   * Admin approves a specific payment record
   */
  async approvePayment(feeId: string, paymentId: string, userId: string) {
    const fee = await this.feeModel.findById(feeId);
    if (!fee) throw new NotFoundException('Fee not found');

    const paymentIndex = fee.payments.findIndex(p => p._id.toString() === paymentId);
    if (paymentIndex === -1) throw new NotFoundException('Payment record not found');

    if (fee.payments[paymentIndex].status !== 'PENDING') {
      throw new BadRequestException('This payment has already been processed');
    }

    // Update payment status
    fee.payments[paymentIndex].status = 'APPROVED';
    fee.payments[paymentIndex].approvedBy = new Types.ObjectId(userId);

    // Update overall fee balance
    fee.paidAmount = (fee.paidAmount || 0) + fee.payments[paymentIndex].amount;
    
    if (fee.paidAmount >= fee.amount) {
      fee.isPaid = true;
      fee.status = FeeStatus.PAID;
      fee.paidAt = new Date();
    }

    // Also find and approve the associated EditRequest
    const editRequest = await this.editRequestModel.findOne({
      entityId: fee._id,
      'newData.paymentId': new Types.ObjectId(paymentId),
      status: EditRequestStatus.PENDING
    });

    if (editRequest) {
      editRequest.status = EditRequestStatus.APPROVED;
      editRequest.reviewedBy = new Types.ObjectId(userId);
      editRequest.reviewedAt = new Date();
      await editRequest.save();
    }

    await fee.save();
    return { message: 'Payment approved successfully' };
  }

  /**
   * Admin rejects a specific payment record
   */
  async rejectPayment(feeId: string, paymentId: string) {
    const fee = await this.feeModel.findById(feeId);
    if (!fee) throw new NotFoundException('Fee not found');

    const paymentIndex = fee.payments.findIndex(p => p._id.toString() === paymentId);
    if (paymentIndex === -1) throw new NotFoundException('Payment record not found');

    fee.payments[paymentIndex].status = 'REJECTED';

    // Also find and reject the associated EditRequest
    const editRequest = await this.editRequestModel.findOne({
      entityId: fee._id,
      'newData.paymentId': new Types.ObjectId(paymentId),
      status: EditRequestStatus.PENDING
    });

    if (editRequest) {
      editRequest.status = EditRequestStatus.REJECTED;
      editRequest.reviewedAt = new Date();
      await editRequest.save();
    }

    await fee.save();
    return { message: 'Payment rejected' };
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
      .populate('classId', 'className section academicYear')
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
