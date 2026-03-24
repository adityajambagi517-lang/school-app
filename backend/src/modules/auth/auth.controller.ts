import { Controller, Post, Body, Get, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ForgotPasswordService } from './forgot-password.service';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    return this.authService.getUserProfile(user.userId);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  // ── Forgot Password (OTP) ──

  @Post('forgot-password')
  async forgotPassword(@Body('userId') userId: string) {
    return this.forgotPasswordService.sendOtp(userId);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('userId') userId: string,
    @Body('otp') otp: string,
  ) {
    return this.forgotPasswordService.verifyOtp(userId, otp);
  }

  @Post('reset-password-otp')
  async resetPasswordOtp(
    @Body('resetToken') resetToken: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.forgotPasswordService.resetPassword(resetToken, newPassword);
  }
}
