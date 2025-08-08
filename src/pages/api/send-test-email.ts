import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { to } = body;
    
    if (!to) {
      return new Response(
        JSON.stringify({ error: 'Email recipient required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    // Try different SMTP configurations
    const smtpUser = import.meta.env.SMTP_USER || '';
    const smtpPass = import.meta.env.SMTP_PASS || '';
    
    const configs = [
      {
        name: 'Gmail Service (Simple)',
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      },
    ];
    
    const results = [];
    
    for (const config of configs) {
      try {
        console.log(`Trying ${config.name} with user: ${config.auth.user}`);
        const transporter = nodemailer.createTransport(config);
        
        // Verify connection
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Connection verified!');
        
        // Send test email
        const info = await transporter.sendMail({
          from: `"Leuchtturm Test" <${import.meta.env.SMTP_FROM || config.auth.user}>`,
          to: to,
          subject: 'Test Email from Leuchtturm System',
          text: 'This is a test email to verify SMTP configuration.',
          html: '<p>This is a <strong>test email</strong> to verify SMTP configuration.</p>',
        });
        
        results.push({
          config: config.name,
          success: true,
          messageId: info.messageId,
        });
        
        // If one works, return success
        return new Response(
          JSON.stringify({
            success: true,
            config: config.name,
            messageId: info.messageId,
            message: `Email sent successfully to ${to}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
        
      } catch (error) {
        results.push({
          config: config.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    // If none worked, return all errors
    return new Response(
      JSON.stringify({
        success: false,
        message: 'All SMTP configurations failed',
        attempts: results,
        debug: {
          SMTP_USER: import.meta.env.SMTP_USER ? `${import.meta.env.SMTP_USER.substring(0, 3)}...` : 'not set',
          SMTP_PASS: import.meta.env.SMTP_PASS ? 'set' : 'not set',
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};