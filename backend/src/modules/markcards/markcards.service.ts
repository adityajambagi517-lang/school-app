import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Markcard,
  MarkcardDocument,
  MarkcardStatus,
} from '../../schemas/markcard.schema';
import {
  EditRequest,
  EditRequestDocument,
  EditRequestType,
  EditRequestStatus,
  EntityType,
} from '../../schemas/edit-request.schema';
import { Teacher, TeacherDocument } from '../../schemas/teacher.schema';
import { CreateMarkcardDto } from './dto/create-markcard.dto';
import { BulkCreateMarkcardDto } from './dto/bulk-create-markcard.dto';
import { UpdateMarkcardDto } from './dto/update-markcard.dto';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientRole } from '../../schemas/notification.schema';

@Injectable()
export class MarkcardsService {
  constructor(
    @InjectModel(Markcard.name) private markcardModel: Model<MarkcardDocument>,
    @InjectModel(EditRequest.name)
    private editRequestModel: Model<EditRequestDocument>,
    @InjectModel(Teacher.name) private teacherModel: Model<TeacherDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * DRAFT: Teacher creates marks (not visible to students)
   */
  async create(
    createMarkcardDto: CreateMarkcardDto,
    userRole: string,
    referenceId: string,
  ) {
    // Only teachers can create marks
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create marks');
    }

    // Verify teacher has access to this class
    await this.verifyTeacherAccess(referenceId, createMarkcardDto.classId);

    const markcard = new this.markcardModel({
      ...createMarkcardDto,
      studentId: new Types.ObjectId(createMarkcardDto.studentId),
      classId: new Types.ObjectId(createMarkcardDto.classId),
      submittedBy: new Types.ObjectId(referenceId),
      status: MarkcardStatus.DRAFT, // Initially in DRAFT
    });

    return markcard.save();
  }

  /**
   * BULK CREATE: Teacher creates marks for all subjects and auto-submits for approval
   */
  async bulkCreate(
    bulkDto: BulkCreateMarkcardDto,
    userRole: string,
    referenceId: string,
  ) {
    // Only teachers can create marks
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create marks');
    }

    // Verify teacher has access to this class
    await this.verifyTeacherAccess(referenceId, bulkDto.classId);

    const teacherId = new Types.ObjectId(referenceId);
    const studentId = new Types.ObjectId(bulkDto.studentId);
    const classId = new Types.ObjectId(bulkDto.classId);

    // Create all markcards as DRAFT first
    const markcardPromises = bulkDto.marks.map((markItem) =>
      this.markcardModel.create({
        studentId,
        classId,
        subject: markItem.subject,
        examType: bulkDto.examType,
        marks: markItem.marks,
        maxMarks: markItem.maxMarks,
        status: MarkcardStatus.DRAFT,
        submittedBy: teacherId,
      }),
    );

    const createdMarkcards = await Promise.all(markcardPromises);

    // Auto-submit all for approval (create edit requests)
    const editRequestPromises = createdMarkcards.map((markcard) =>
      this.editRequestModel.create({
        entityType: EntityType.MARKS,
        entityId: markcard._id,
        classId: classId,
        requestType: EditRequestType.CREATE,
        status: EditRequestStatus.PENDING,
        newData: markcard.toObject(),
        requestedBy: teacherId,
        requestedAt: new Date(),
      }),
    );

    const createdEditRequests = await Promise.all(editRequestPromises);

    // Notify admins
    await this.notifyAdmins({
      type: 'marks_approval_pending',
      title: 'New Marks Pending Approval',
      message: `Teacher has submitted ${createdMarkcards.length} marks for bulk student registration.`,
      relatedEntity: { type: 'bulk_marks', id: createdEditRequests[0]._id }, // Reference first one or handle differently
    });

    // Update all markcards to SUBMITTED status
    const updatePromises = createdMarkcards.map((markcard, index) => {
      markcard.status = MarkcardStatus.SUBMITTED;
      markcard.editRequestId = createdEditRequests[index]._id;
      markcard.submittedAt = new Date();
      return markcard.save();
    });

    await Promise.all(updatePromises);

    return {
      message: `Successfully submitted ${createdMarkcards.length} subject marks for admin approval`,
      count: createdMarkcards.length,
      student: bulkDto.studentId,
      examType: bulkDto.examType,
      markcards: createdMarkcards.map((m) => ({
        id: m._id,
        subject: m.subject,
        marks: m.marks,
        maxMarks: m.maxMarks,
        percentage: Math.round((m.marks / m.maxMarks) * 100),
      })),
    };
  }

  /**
   * SUBMITTED: Teacher submits marks for admin approval
   */
  async submitForApproval(
    markcardId: string,
    userRole: string,
    referenceId: string,
  ) {
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can submit marks');
    }

    const markcard = await this.markcardModel.findById(markcardId);
    if (!markcard) {
      throw new NotFoundException('Markcard not found');
    }

    // Verify ownership
    if (markcard.submittedBy.toString() !== referenceId) {
      throw new ForbiddenException('You can only submit your own marks');
    }

    if (markcard.status !== MarkcardStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT marks can be submitted');
    }

    // Create edit request
    const editRequest = new this.editRequestModel({
      entityType: EntityType.MARKS,
      entityId: markcard._id,
      classId: markcard.classId,
      requestType: EditRequestType.CREATE,
      status: EditRequestStatus.PENDING,
      newData: markcard.toObject(),
      requestedBy: new Types.ObjectId(referenceId),
      requestedAt: new Date(),
    });

    await editRequest.save();

    // Notify admins
    await this.notifyAdmins({
      type: 'marks_approval_pending',
      title: 'Marks Pending Approval',
      message: `A teacher has submitted marks for student ID: ${markcard.studentId} for approval.`,
      relatedEntity: { type: 'markcard', id: markcard._id },
    });

    // Update markcard status
    markcard.status = MarkcardStatus.SUBMITTED;
    markcard.editRequestId = editRequest._id;
    markcard.submittedAt = new Date();
    await markcard.save();

    return {
      message: 'Marks submitted for approval',
      markcardId,
      editRequestId: editRequest._id,
    };
  }

  /**
   * Helper to notify all admins
   */
  private async notifyAdmins(data: {
    type: string;
    title: string;
    message: string;
    relatedEntity?: { type: string; id: any };
  }) {
    try {
      const admins = await this.userModel.find({
        role: UserRole.ADMIN,
        isActive: true,
      });
      const notificationPromises = admins.map((admin) =>
        this.notificationsService.create({
          recipientId: admin._id,
          recipientRole: NotificationRecipientRole.ADMIN,
          ...data,
        }),
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to send admin notifications:', error);
      // Don't throw, we don't want to break the main flow if notifications fail
    }
  }

  /**
   * BULK APPROVE: Admin approves multiple mark requests at once
   */
  async bulkApproveMarks(
    editRequestIds: string[],
    userRole: string,
    userId: string,
    comments?: string,
  ) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve marks');
    }

    const results = await Promise.all(
      editRequestIds.map(async (id) => {
        try {
          return await this.approveMarks(id, userRole, userId, comments);
        } catch (error) {
          return { id, error: error.message, success: false };
        }
      }),
    );

    return {
      message: `Processed ${editRequestIds.length} approval requests`,
      results,
    };
  }

  /**
   * APPROVED: Admin approves marks (teacher can now edit)
   */
  async approveMarks(
    editRequestId: string,
    userRole: string,
    userId: string,
    comments?: string,
  ) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can approve marks');
    }

    const editRequest = await this.editRequestModel.findById(editRequestId);
    if (!editRequest) {
      throw new NotFoundException('Edit request not found');
    }

    if (editRequest.status !== EditRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    // Update edit request
    editRequest.status = EditRequestStatus.APPROVED;
    editRequest.reviewedBy = new Types.ObjectId(userId);
    editRequest.reviewedAt = new Date();
    editRequest.reviewComments = comments;
    await editRequest.save();

    // Update markcard
    const markcard = await this.markcardModel.findById(editRequest.entityId);
    if (!markcard) {
      throw new NotFoundException('Markcard not found');
    }

    markcard.status = MarkcardStatus.APPROVED;
    markcard.approvedBy = new Types.ObjectId(userId);
    markcard.approvedAt = new Date();
    // Auto-publish: immediately make marks visible to students upon approval
    markcard.status = MarkcardStatus.PUBLISHED;
    markcard.publishedAt = new Date();
    await markcard.save();

    // Clean up approval notifications for this markcard
    try {
      await this.notificationsService.deleteByRelatedEntity(
        'markcard',
        markcard._id.toString(),
      );
      await this.notificationsService.deleteByRelatedEntity(
        'EditRequest',
        editRequestId,
      );
    } catch (error) {
      console.error('Failed to clean up notifications:', error);
      // Don't throw, main operation succeeded
    }

    return {
      message: 'Marks approved and published. Now visible to students.',
    };
  }

  /**
   * PUBLISHED: Admin publishes marks (students can now see)
   */
  async publishMarks(markcardId: string, userRole: string, userId: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can publish marks');
    }

    const markcard = await this.markcardModel.findById(markcardId);
    if (!markcard) {
      throw new NotFoundException('Markcard not found');
    }

    if (markcard.status !== MarkcardStatus.APPROVED) {
      throw new BadRequestException('Only approved marks can be published');
    }

    markcard.status = MarkcardStatus.PUBLISHED;
    markcard.publishedAt = new Date();
    await markcard.save();

    return { message: 'Marks published. Now visible to students.' };
  }

  /**
   * Get marks for student (only PUBLISHED)
   */
  async getStudentMarks(studentId: string) {
    return this.markcardModel
      .find({
        studentId: new Types.ObjectId(studentId),
        status: MarkcardStatus.PUBLISHED, // Only published marks
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all marks for teacher's class (all statuses)
   */
  async getTeacherMarks(classId: string, referenceId: string) {
    await this.verifyTeacherAccess(referenceId, classId);

    return this.markcardModel
      .find({
        classId: new Types.ObjectId(classId),
        submittedBy: new Types.ObjectId(referenceId),
      })
      .populate('studentId', 'name rollNumber')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all pending approval requests (Admin only)
   */
  async getPendingApprovals() {
    return this.editRequestModel
      .find({
        entityType: EntityType.MARKS,
        status: EditRequestStatus.PENDING,
      })
      .populate('requestedBy', 'name')
      .populate('entityId')
      .populate('classId', 'className section academicYear')
      .sort({ requestedAt: 1 })
      .exec();
  }

  private async verifyTeacherAccess(teacherId: string, classId: string) {
    const teacher = await this.teacherModel.findById(teacherId);
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.assignedClassId.toString() !== classId) {
      throw new ForbiddenException(
        'You can only manage marks for your assigned class',
      );
    }
  }
}
