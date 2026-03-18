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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';
import { UserRole } from '../../schemas/user.schema';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('register')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  register(
    @Body() registerDto: RegisterStudentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.studentsService.register(registerDto, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  create(
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.studentsService.create(createStudentDto, user);
  }

  @Post('upload-image')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
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
    @Body('studentId') studentId: string,
  ) {
    const imageUrl = `/uploads/profiles/${file.filename}`;
    return this.studentsService.updateProfileImage(studentId, imageUrl);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  search(@Query('q') query: string, @CurrentUser() user: CurrentUserData) {
    return this.studentsService.search(query, user);
  }

  @Get('class/:classId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findByClass(
    @Param('classId') classId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.studentsService.findByClass(classId, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.studentsService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('by-studentid/:studentId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findByStudentId(@Param('studentId') studentId: string) {
    return this.studentsService.findByStudentId(studentId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.studentsService.remove(id, user);
  }
}
