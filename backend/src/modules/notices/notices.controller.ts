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
import { diskStorage } from 'multer';
import { extname } from 'path';
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
      storage: diskStorage({
        destination: './uploads/notices',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const targetRoles = JSON.parse(body.targetRoles || '[]');
    const noticeData = {
      title: body.title,
      content: body.content,
      targetRoles,
      imageUrl: file ? `/uploads/notices/${file.filename}` : undefined,
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
