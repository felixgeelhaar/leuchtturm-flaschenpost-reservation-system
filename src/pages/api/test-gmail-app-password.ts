import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { testPassword } = body;
    
    // Use provided test password or environment variable
    const user = 'leuchtturm.elternbeirat@gmail.com';
    const pass = testPassword || process.env.SMTP_PASS || '';
    
    if (!pass) {
      return new Response(
        JSON.stringify({ 
          error: 'No password provided',
          hint: 'Send testPassword in body or set SMTP_PASS environment variable'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    console.log('Testing Gmail authentication with:');
    console.log(`User: ${user}`);
    console.log(`Password length: ${pass.length} characters`);
    console.log(`Password format check: ${/^[a-z]{16}$/.test(pass) ? 'Valid format (16 lowercase letters)' : 'Invalid format'}`);
    
    // Test different transporter configurations
    const configs = [
      {
        name: 'Service: gmail',
        config: {
          service: 'gmail',
          auth: { user, pass }
        }
      },
      {
        name: 'Manual SMTP settings',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user, pass }
        }
      },
      {
        name: 'Manual with TLS',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          }
        }
      }
    ];
    
    const results = [];
    
    for (const { name, config } of configs) {
      try {
        console.log(`\nTesting configuration: ${name}`);
        const transporter = nodemailer.createTransport(config);
        
        // Test connection
        await transporter.verify();
        console.log(`✓ ${name}: Authentication successful`);
        
        results.push({
          config: name,
          success: true,
          message: 'Authentication successful'
        });
        
        // If authentication works, try sending a test email
        try {
          const info = await transporter.sendMail({
            from: `"Leuchtturm Test" <${user}>`,
            to: user, // Send to self
            subject: `Test Email - ${name}`,
            text: `This test email confirms that Gmail authentication is working with configuration: ${name}`,
            html: `<p>This test email confirms that Gmail authentication is working with configuration: <strong>${name}</strong></p>`
          });
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Authentication and email sending successful!',
              workingConfig: name,
              messageId: info.messageId,
              details: {
                user,
                passwordLength: pass.length,
                passwordFormat: /^[a-z]{16}$/.test(pass) ? 'Valid (16 lowercase letters)' : 'Check format',
                response: info.response
              }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          );
        } catch (sendError: any) {
          console.error(`✗ ${name}: Could send email:`, sendError.message);
          results.push({
            config: name,
            success: false,
            error: `Auth OK but send failed: ${sendError.message}`
          });
        }
        
      } catch (error: any) {
        console.error(`✗ ${name}: Authentication failed:`, error.message);
        results.push({
          config: name,
          success: false,
          error: error.message
        });
      }
    }
    
    // All configurations failed
    return new Response(
      JSON.stringify({
        success: false,
        message: 'All configurations failed',
        results,
        debug: {
          user,
          passwordLength: pass.length,
          passwordFormat: /^[a-z]{16}$/.test(pass) ? 'Valid format' : 'Invalid format - should be 16 lowercase letters',
          hint: pass.length !== 16 ? 'App password should be exactly 16 characters' : 
                pass !== pass.toLowerCase() ? 'App password should be all lowercase' :
                /\s/.test(pass) ? 'App password should not contain spaces' :
                'Try generating a new app password in Google Account settings'
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