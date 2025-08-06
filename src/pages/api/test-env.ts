import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Check different ways of accessing env vars
  const checks = {
    // Astro's import.meta.env
    importMetaEnv: {
      PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      SITE_URL: import.meta.env.SITE_URL,
    },
    // Node's process.env (server-side only)
    processEnv: {
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SITE_URL: process.env.SITE_URL,
    },
    // Check if .env was loaded
    envFileLoaded: {
      hasPublicSupabaseUrl: !!(import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: !!(import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSiteUrl: !!(import.meta.env.SITE_URL || process.env.SITE_URL),
    }
  };

  return new Response(JSON.stringify(checks, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};