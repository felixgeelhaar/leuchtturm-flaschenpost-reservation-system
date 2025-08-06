import type { APIRoute } from 'astro';
import { DatabaseService } from '@/lib/database';

const db = new DatabaseService();

export const GET: APIRoute = async () => {
  try {
    // Get magazines directly from database with no caching
    const magazines = await db.getActiveMagazines();
    
    // Also get raw data from Supabase for comparison
    const supabase = (db as any).supabase;
    const { data: rawData, error } = await supabase
      .from('magazines')
      .select('*')
      .order('created_at', { ascending: false });
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        fromService: {
          count: magazines.length,
          data: magazines
        },
        rawFromSupabase: {
          count: rawData?.length || 0,
          data: rawData || [],
          error: error?.message || null
        }
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
};