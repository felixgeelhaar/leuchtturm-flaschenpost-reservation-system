import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  // Check environment variables
  const hasSmtpUser = !!import.meta.env.SMTP_USER;
  const hasSmtpPass = !!import.meta.env.SMTP_PASS;
  const hasSupabaseUrl = !!import.meta.env.PUBLIC_SUPABASE_URL;
  const hasSupabaseKey = !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: import.meta.env.MODE || 'unknown',
      hasSmtpConfig: hasSmtpUser && hasSmtpPass,
      hasSupabaseConfig: hasSupabaseUrl && hasSupabaseKey,
      smtpUser: hasSmtpUser ? import.meta.env.SMTP_USER?.substring(0, 3) + '...' : 'not set',
    },
    services: {
      database: hasSupabaseUrl && hasSupabaseKey ? 'configured' : 'missing config',
      email: hasSmtpUser && hasSmtpPass ? 'configured' : 'missing config',
    }
  };
  
  return new Response(
    JSON.stringify(status, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};