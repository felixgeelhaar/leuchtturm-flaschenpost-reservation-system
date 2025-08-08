import type { APIRoute } from 'astro';
import { EmailService } from '@/lib/email/email-service';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Check environment variables
    const hasSmtpUser = !!process.env.SMTP_USER;
    const hasSmtpPass = !!process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'not set';
    const smtpFrom = process.env.SMTP_FROM || 'not set';
    
    // Try to initialize email service
    let emailServiceStatus = 'not initialized';
    let verificationStatus = 'not tested';
    
    try {
      const emailService = new EmailService();
      emailServiceStatus = 'initialized successfully';
      
      // Try to verify connection
      try {
        await emailService.verifyConnection();
        verificationStatus = 'connection verified';
      } catch (verifyError) {
        verificationStatus = `verification failed: ${verifyError instanceof Error ? verifyError.message : 'unknown error'}`;
      }
    } catch (initError) {
      emailServiceStatus = `initialization failed: ${initError instanceof Error ? initError.message : 'unknown error'}`;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        environment: {
          SMTP_USER: hasSmtpUser ? 'configured' : 'not configured',
          SMTP_PASS: hasSmtpPass ? 'configured' : 'not configured',
          SMTP_HOST: smtpHost,
          SMTP_FROM: smtpFrom,
        },
        emailService: {
          status: emailServiceStatus,
          verification: verificationStatus,
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
  }
};