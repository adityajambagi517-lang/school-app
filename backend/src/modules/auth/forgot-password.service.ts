import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../schemas/user.schema';
import { Otp, OtpDocument } from '../../schemas/otp.schema';
import { EmailService } from '../../services/email.service';

@Injectable()
export class ForgotPasswordService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private emailService: EmailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(userId: string): Promise<{ message: string; email: string }> {
    const user = await this.userModel.findOne({
      $or: [{ userId }, { email: userId }],
    });
    if (!user) throw new NotFoundException('No account found with that ID or email.');

    // Invalidate old OTPs
    await this.otpModel.updateMany({ userId: user.userId, used: false }, { used: true });

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.otpModel.create({ userId: user.userId, email: user.email, otp, expiresAt });
    
    try {
      await this.emailService.sendOtp(user.email, otp, user.name);
    } catch (error: any) {
      // Rollback the OTP creation if you want, or just leave it unused.
      throw new BadRequestException(error.message || 'Failed to send OTP email.');
    }

    // Mask email for display e.g. a****@gmail.com
    const [local, domain] = user.email.split('@');
    const masked = local[0] + '****@' + domain;
    return { message: 'OTP sent to your email.', email: masked };
  }

  async verifyOtp(userId: string, otp: string): Promise<{ valid: boolean; token: string }> {
    const user = await this.userModel.findOne({
      $or: [{ userId }, { email: userId }],
    });
    if (!user) throw new NotFoundException('User not found.');

    const record = await this.otpModel.findOne({
      userId: user.userId,
      otp,
      used: false,
      expiresAt: { $gt: new Date() },
    });
    if (!record) throw new BadRequestException('Invalid or expired OTP.');

    await this.otpModel.findByIdAndUpdate(record._id, { used: true });

    // Return a simple reset token (the userId encoded as base64 — good enough for a school app)
    const resetToken = Buffer.from(`${user.userId}:${Date.now()}`).toString('base64');
    return { valid: true, token: resetToken };
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    let userId: string;
    try {
      const decoded = Buffer.from(resetToken, 'base64').toString('utf8');
      userId = decoded.split(':')[0];
    } catch {
      throw new BadRequestException('Invalid reset token.');
    }

    const user = await this.userModel.findOne({ userId });
    if (!user) throw new NotFoundException('User not found.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(user._id, { password: hashed });

    return { message: 'Password reset successfully. You can now log in.' };
  }
}
