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
    
    const baseUser = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    
    // Try different username formats
    const variations = [
      {
        name: 'As configured',
        user: baseUser,
      },
      {
        name: 'Without @gmail.com',
        user: baseUser.replace('@gmail.com', ''),
      },
      {
        name: 'With @googlemail.com',
        user: baseUser.replace('@gmail.com', '@googlemail.com'),
      },
    ];
    
    const results = [];
    
    for (const variation of variations) {
      try {
        const config = {
          service: 'gmail',
          auth: {
            user: variation.user,
            pass: pass,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
        };
        
        console.log(`Testing ${variation.name}: ${variation.user}`);
        const transporter = nodemailer.createTransport(config);
        
        await transporter.verify();
        
        const info = await transporter.sendMail({
          from: `"Test" <${variation.user}>`,
          to: to,
          subject: 'Test Email - Username Variation',
          text: `This email was sent using username: ${variation.user}`,
        });
        
        results.push({
          variation: variation.name,
          success: true,
          messageId: info.messageId,
        });
        
        // If one works, return immediately
        return new Response(
          JSON.stringify({
            success: true,
            workingFormat: variation.name,
            username: variation.user,
            messageId: info.messageId,
            message: `Email sent successfully using ${variation.name}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
        
      } catch (error: any) {
        results.push({
          variation: variation.name,
          success: false,
          error: error.message,
        });
      }
    }
    
    // None worked
    return new Response(
      JSON.stringify({
        success: false,
        message: 'All username variations failed',
        attempts: results,
        info: {
          configuredUser: baseUser,
          passLength: pass.length,
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