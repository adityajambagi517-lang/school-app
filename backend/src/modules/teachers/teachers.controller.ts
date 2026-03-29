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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TeachersService } from './teachers.service';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('with-stats')
  @Roles(UserRole.ADMIN)
  findAllWithStats() {
    return this.teachersService.findAllWithStats();
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  search(@Query('q') query: string) {
    return this.teachersService.search(query);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.teachersService.findAll();
  }

  @Post('register')
  @Roles(UserRole.ADMIN)
  register(@Body() registerDto: RegisterTeacherDto) {
    return this.teachersService.register(registerDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createTeacherDto: any) {
    return this.teachersService.create(createTeacherDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateTeacherDto: any) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Post('upload-image')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/teachers',
        filename: (req, file, cb) => {
          const teacherId = req.body.teacherId || 'unknown';
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${teacherId}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('teacherId') teacherId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!teacherId) {
      throw new BadRequestException('Teacher ID is required');
    }

    const imageUrl = `/uploads/teachers/${file.filename}`;

    return this.teachersService.updateProfileImage(teacherId, imageUrl);
  }

  @Patch(':id/assign-class')
  @Roles(UserRole.ADMIN)
  assignClass(@Param('id') id: string, @Body('classId') classId: string) {
    return this.teachersService.assignClass(id, classId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
