// This endpoint has been removed for security reasons
// Environment variables should never be exposed in production

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: "Environment test endpoint removed for security",
    status: "disabled"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};