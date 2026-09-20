import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const appUrl = String(this.config.get('APP_PUBLIC_URL') ?? 'http://localhost:3001');
    const link = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const from = String(this.config.get('EMAIL_FROM') ?? 'noreply@vridhi.app');

    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.warn(`Password reset for ${to}: ${link}`);
      return;
    }

    const apiKey = this.config.get('EMAIL_API_KEY');
    if (!apiKey) {
      this.logger.error(`EMAIL_API_KEY missing; could not send reset email to ${to}`);
      return;
    }

    // Provider-agnostic hook: wire SendGrid/SES/Resend in production.
    this.logger.log(`Queued password reset email to ${to} from ${from}`);
  }
}
