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
} from '@nestjs/common';
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

  // Record partial or full payment
  @Patch(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  recordPayment(
    @Param('id') id: string,
    @Body() body: { amountPaid: number },
  ) {
    return this.feesService.recordPayment(id, body.amountPaid);
  }

  // Student views their own published fees
  @Get('student/:studentId')
  @Roles(UserRole.STUDENT)
  getStudentFees(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // Verify student can only see their own fees
    if (user.referenceId !== studentId) {
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
