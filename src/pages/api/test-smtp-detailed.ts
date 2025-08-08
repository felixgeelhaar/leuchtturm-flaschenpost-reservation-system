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
    
    const startTime = Date.now();
    const results = [];
    
    // Test with detailed error catching
    const config = {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      logger: true, // Enable logging
      debug: true, // Enable debug output
      connectionTimeout: 5000, // 5 seconds to connect
      greetingTimeout: 5000, // 5 seconds for greeting
      socketTimeout: 5000, // 5 seconds for socket
    };
    
    try {
      console.log('Creating transporter at', new Date().toISOString());
      console.log('Config user:', config.auth.user);
      console.log('Config pass length:', config.auth.pass.length);
      
      const transporter = nodemailer.createTransport(config);
      
      console.log('Verifying connection at', new Date().toISOString());
      await transporter.verify();
      console.log('Connection verified at', new Date().toISOString());
      
      console.log('Sending email at', new Date().toISOString());
      const info = await transporter.sendMail({
        from: `"Leuchtturm Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: to,
        subject: 'Test Email from Leuchtturm System',
        text: 'This is a test email from the production system.',
        html: '<p>This is a <strong>test email</strong> from the production system.</p>',
      });
      
      console.log('Email sent at', new Date().toISOString());
      
      return new Response(
        JSON.stringify({
          success: true,
          messageId: info.messageId,
          accepted: info.accepted,
          timeMs: Date.now() - startTime,
          message: `Email sent successfully to ${to}`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
      
    } catch (error: any) {
      console.error('Email error at', new Date().toISOString());
      console.error('Error details:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
          command: error.command,
          timeMs: Date.now() - startTime,
          details: {
            responseCode: error.responseCode,
            response: error.response,
            stack: error.stack?.split('\n').slice(0, 5),
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
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