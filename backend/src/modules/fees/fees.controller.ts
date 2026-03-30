import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // Teacher/Admin creates fee (DRAFT)
  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  create(
    @Body() createFeeDto: CreateFeeDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.create(
      createFeeDto,
      user.role,
      user.referenceId || '',
    );
  }

  // Teacher/Admin updates a fee (DRAFT only)
  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateFeeDto: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.update(id, updateFeeDto, user.role, user.referenceId || '');
  }

  // Teacher/Admin deletes a fee (DRAFT only)
  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.delete(id, user.role, user.referenceId || '');
  }

  // Teacher submits fee for approval (DRAFT → SUBMITTED)
  @Patch(':id/submit')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.submitForApproval(
      id,
      user.role,
      user.referenceId || '',
    );
  }

  // Admin approves fee (SUBMITTED → APPROVED)
  @Patch('edit-request/:id/approve')
  @Roles(UserRole.ADMIN)
  approveFee(
    @Param('id') id: string,
    @Body() body: { comments: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.approveFee(id, user.userId, body.comments);
  }

  // Admin publishes approved fee (APPROVED → PUBLISHED)
  @Patch(':id/publish')
  @Roles(UserRole.ADMIN)
  publishFee(@Param('id') id: string) {
    return this.feesService.publishFee(id);
  }

  // Admin marks fee as paid
  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN)
  markAsPaid(@Param('id') id: string) {
    return this.feesService.markAsPaid(id);
  }

  // Record payment with proof (Teacher/Admin)
  @Post(':id/record-payment')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(FileInterceptor('receipt'))
  recordPaymentWithProof(
    @Param('id') id: string,
    @Body() body: { amountPaid: string; transactionId?: string; remarks?: string },
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.recordPaymentWithProof(
      id,
      Number(body.amountPaid),
      user.role,
      user.referenceId || '',
      file?.path,
      body.transactionId,
      body.remarks
    );
  }

  // Admin approves a specific payment record
  @Patch(':id/payments/:paymentId/approve')
  @Roles(UserRole.ADMIN)
  approvePayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.approvePayment(id, paymentId, user.userId);
  }

  // Admin rejects a specific payment record
  @Patch(':id/payments/:paymentId/reject')
  @Roles(UserRole.ADMIN)
  rejectPayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.feesService.rejectPayment(id, paymentId);
  }

  // Student views their own fees; Teacher/Admin can view any student's fees
  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  getStudentFees(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Students can only see their own fees
    if (user.role === UserRole.STUDENT && user.referenceId !== studentId) {
      throw new Error('Access denied');
    }
    return this.feesService.getStudentFees(studentId);
  }

  // Admin approval queue
  @Get('pending-approvals')
  @Roles(UserRole.ADMIN)
  getPendingApprovals() {
    return this.feesService.getPendingApprovals();
  }

  // Get fees by class
  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  getFeesByClass(
    @Param('classId') classId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.feesService.getFeesByClass(
      classId,
      user.role,
      user.referenceId || '',
    );
  }
}
