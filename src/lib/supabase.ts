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
  // In Netlify Functions, environment variables are in Netlify.env or process.env
  // Try multiple ways to get the service role key
  const serviceRoleKey = 
    // @ts-ignore - Netlify global might exist
    (typeof Netlify !== 'undefined' && Netlify?.env?.get?.('SUPABASE_SERVICE_ROLE_KEY')) ||
    process.env?.SUPABASE_SERVICE_ROLE_KEY || 
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    console.error('Warning: SUPABASE_SERVICE_ROLE_KEY not found, using anon key with limited permissions');
    // Use anon key as fallback - this will work for reads but may fail for writes due to RLS
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