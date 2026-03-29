import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../decorators/current-user.decorator';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async create(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    let submitterName = user.name;

    // Fallback: If name is missing from JWT (older tokens), fetch it from DB
    if (!submitterName) {
      const dbUser = await this.userModel.findOne({ userId: user.userId }).select('name').exec();
      submitterName = dbUser?.name || 'Unknown User';
    }

    return this.supportService.create({
      ...body,
      submittedBy: user.userId,
      submitterName,
      role: user.role,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.supportService.findAll();
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN)
  resolve(@Param('id') id: string, @Body('adminNotes') adminNotes: string) {
    return this.supportService.resolve(id, adminNotes);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }
}
