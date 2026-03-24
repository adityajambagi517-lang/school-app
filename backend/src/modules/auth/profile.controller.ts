import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('auth/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @Patch()
  async updateProfile(@Request() req, @Body() updateDto: UpdateUserDto) {
    return this.authService.updateProfile(req.user.userId, updateDto);
  }

  @Post('upload-picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  async uploadPicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Convert buffer to Base64 data URI — stored directly in MongoDB Atlas
    const base64 = file.buffer.toString('base64');
    const pictureUrl = `data:${file.mimetype};base64,${base64}`;

    await this.authService.updateProfile(req.user.userId, {
      profilePicture: pictureUrl,
    });

    return {
      message: 'Profile picture uploaded successfully',
      url: pictureUrl,
    };
  }
}
