import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';

@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const targetRoles = JSON.parse(body.targetRoles || '[]');

    // Convert buffer to Base64 data URI — stored directly in MongoDB Atlas
    let imageUrl: string | undefined;
    if (file) {
      const base64 = file.buffer.toString('base64');
      imageUrl = `data:${file.mimetype};base64,${base64}`;
    }

    const noticeData = {
      title: body.title,
      content: body.content,
      targetRoles,
      imageUrl,
    };
    return this.noticesService.create(noticeData);
  }

  @Get()
  findAll(@CurrentUser() user: CurrentUserData) {
    if (user.role === UserRole.ADMIN) {
      return this.noticesService.findAll();
    }
    return this.noticesService.findForRole(user.role as UserRole);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.noticesService.update(id, { isActive });
  }
}
