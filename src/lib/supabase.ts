import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// Client-side Supabase client (with anon key)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client (with service role key) - Only use server-side!
export function createServerSupabaseClient() {
  // In Netlify, environment variables are available directly on process.env
  const serviceRoleKey = process.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('Warning: SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key');
    console.error('Available env vars:', {
      hasProcessEnv: typeof process !== 'undefined' && process.env,
      hasImportMeta: import.meta.env,
      keys: typeof process !== 'undefined' && process.env ? Object.keys(process.env).filter(k => k.includes('SUPABASE')) : []
    });
    // Fallback to anon key for testing - this will have limited permissions
    const fallbackKey = supabaseAnonKey;
    if (!fallbackKey) {
      throw new Error('Neither SUPABASE_SERVICE_ROLE_KEY nor anon key available');
    }
    return createClient<Database>(supabaseUrl, fallbackKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}