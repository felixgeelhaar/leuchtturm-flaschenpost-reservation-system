import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const smtpUser = process.env.SMTP_USER || 'not set';
  const smtpPass = process.env.SMTP_PASS || 'not set';
  const smtpFrom = process.env.SMTP_FROM || 'not set';
  
  // Check if SMTP_USER is full email
  const hasAtSign = smtpUser.includes('@');
  const userLength = smtpUser.length;
  const passLength = smtpPass.length;
  
  // Check for common issues
  const issues = [];
  
  if (smtpUser === 'not set') {
    issues.push('SMTP_USER not configured');
  } else if (!hasAtSign) {
    issues.push('SMTP_USER should be full email address (missing @)');
  }
  
  if (smtpPass === 'not set') {
    issues.push('SMTP_PASS not configured');
  } else if (passLength !== 16) {
    issues.push(`SMTP_PASS should be 16 characters for Gmail app password (current: ${passLength})`);
  }
  
  if (smtpFrom === 'not set') {
    issues.push('SMTP_FROM not configured');
  }
  
  return new Response(
    JSON.stringify({
      analysis: {
        SMTP_USER: {
          configured: smtpUser !== 'not set',
          hasAtSign,
          length: userLength,
          preview: smtpUser !== 'not set' ? `${smtpUser.substring(0, 3)}...${smtpUser.substring(userLength - 10)}` : 'not set'
        },
        SMTP_PASS: {
          configured: smtpPass !== 'not set',
          length: passLength,
          isAppPasswordLength: passLength === 16
        },
        SMTP_FROM: {
          configured: smtpFrom !== 'not set',
          value: smtpFrom
        }
      },
      issues: issues.length > 0 ? issues : ['No obvious issues found'],
      recommendation: issues.length > 0 
        ? 'Fix the issues above in Netlify environment variables'
        : 'Credentials look correct. If still not working, regenerate Gmail app password.'
    }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  );
};