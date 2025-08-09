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
  // In Astro, environment variables are accessed via import.meta.env
  // For server-only variables (without PUBLIC_ prefix), they're available in server-side code
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error(
      'Warning: SUPABASE_SERVICE_ROLE_KEY not found, using anon key with limited permissions',
    );
    // Use anon key as fallback - this will work for reads but may fail for writes due to RLS
    const fallbackKey = supabaseAnonKey;
    if (!fallbackKey) {
      throw new Error(
        'Neither SUPABASE_SERVICE_ROLE_KEY nor anon key available',
      );
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
