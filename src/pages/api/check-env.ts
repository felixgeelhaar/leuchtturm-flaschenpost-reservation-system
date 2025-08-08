import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? `Set (${process.env.SMTP_PASS.length} chars)` : 'NOT SET',
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
      SMTP_FROM: process.env.SMTP_FROM || 'NOT SET',
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