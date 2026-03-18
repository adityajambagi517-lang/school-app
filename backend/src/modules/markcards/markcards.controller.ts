import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarkcardsService } from './markcards.service';
import { CreateMarkcardDto } from './dto/create-markcard.dto';
import { BulkCreateMarkcardDto } from './dto/bulk-create-markcard.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('markcards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarkcardsController {
  constructor(private readonly markcardsService: MarkcardsService) {}

  // TEACHER: Create marks (DRAFT)
  @Post()
  @Roles(UserRole.TEACHER)
  create(
    @Body() createMarkcardDto: CreateMarkcardDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.markcardsService.create(
      createMarkcardDto,
      user.role,
      user.referenceId || '',
    );
  }

  // TEACHER: Bulk create marks for all subjects (auto-submit for approval)
  @Post('bulk')
  @Roles(UserRole.TEACHER)
  bulkCreate(
    @Body() bulkCreateDto: BulkCreateMarkcardDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.markcardsService.bulkCreate(
      bulkCreateDto,
      user.role,
      user.referenceId || '',
    );
  }

  // TEACHER: Submit marks for approval (DRAFT → SUBMITTED)
  @Patch(':id/submit')
  @Roles(UserRole.TEACHER)
  submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.markcardsService.submitForApproval(
      id,
      user.role,
      user.referenceId || '',
    );
  }

  // ADMIN: Approve marks (SUBMITTED → APPROVED)
  @Patch('edit-request/:id/approve')
  @Roles(UserRole.ADMIN)
  approveMarks(
    @Param('id') editRequestId: string,
    @CurrentUser() user: CurrentUserData,
    @Body('comments') comments?: string,
  ) {
    return this.markcardsService.approveMarks(
      editRequestId,
      user.role,
      user._id,
      comments,
    );
  }

  // ADMIN: Bulk approve marks
  @Patch('bulk-approve')
  @Roles(UserRole.ADMIN)
  bulkApproveMarks(
    @Body('editRequestIds') editRequestIds: string[],
    @CurrentUser() user: CurrentUserData,
    @Body('comments') comments?: string,
  ) {
    return this.markcardsService.bulkApproveMarks(
      editRequestIds,
      user.role,
      user._id,
      comments,
    );
  }

  // ADMIN: Publish marks (APPROVED → PUBLISHED)
  @Patch(':id/publish')
  @Roles(UserRole.ADMIN)
  publishMarks(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.markcardsService.publishMarks(id, user.role, user._id);
  }

  // STUDENT: Get own marks (only PUBLISHED)
  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  getStudentMarks(@Param('studentId') studentId: string) {
    return this.markcardsService.getStudentMarks(studentId);
  }

  // TEACHER: Get marks for their class
  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  getTeacherMarks(
    @Param('classId') classId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.markcardsService.getTeacherMarks(
      classId,
      user.referenceId || '',
    );
  }

  // ADMIN: Get all pending approvals
  @Get('pending-approvals')
  @Roles(UserRole.ADMIN)
  getPendingApprovals() {
    return this.markcardsService.getPendingApprovals();
  }
}
