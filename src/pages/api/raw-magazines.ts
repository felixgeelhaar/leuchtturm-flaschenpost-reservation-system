import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase';

export const GET: APIRoute = async () => {
  try {
    const supabase = createServerSupabaseClient();
    
    // Direct query without any DatabaseService wrapper
    const { data: allMagazines, error: allError } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Query only active magazines
    const { data: activeMagazines, error: activeError } = await supabase
      .from('magazines')
      .select('*')
      .eq('is_active', true)
      .gt('available_copies', 0)
      .order('publish_date', { ascending: false });
    
    // Get count
    const { count } = await supabase
      .from('magazines')
      .select('*', { count: 'exact', head: true });
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        allMagazines: {
          count: allMagazines?.length || 0,
          data: allMagazines || [],
          error: allError?.message || null
        },
        activeMagazines: {
          count: activeMagazines?.length || 0,
          data: activeMagazines || [],
          error: activeError?.message || null
        },
        totalCount: count || 0,
        environment: {
          supabaseUrl: process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
};