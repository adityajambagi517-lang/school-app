import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';

// Fix for Node >= 17 failing to connect via IPv6 if the network doesn't support it
dns.setDefaultResultOrder('ipv4first');

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendOtp(email: string, otp: string, userName: string): Promise<void> {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    if (!gmailUser) {
      this.logger.warn('GMAIL_USER not configured — OTP email not sent. OTP: ' + otp);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"School Management" <${gmailUser}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; margin-bottom: 8px;">Password Reset</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your OTP for password reset is:</p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error: any) {
      this.logger.error(`Failed to send OTP email: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}
