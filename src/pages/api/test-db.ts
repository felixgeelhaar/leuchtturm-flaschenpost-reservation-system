import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    console.log('Testing database connection...');
    
    const supabase = createServerSupabaseClient();
    
    // Try to fetch magazines
    const { data: magazines, error: magazineError } = await supabase
      .from('magazines')
      .select('id, title, available_copies')
      .limit(1);
    
    if (magazineError) {
      console.error('Magazine fetch error:', magazineError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error',
          message: magazineError.message,
          details: magazineError,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Try to fetch users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError) {
      console.error('User fetch error:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User fetch error',
          message: userError.message,
          details: userError,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database connection successful',
        magazines: magazines || [],
        userCount: users?.length || 0,
        hasServiceKey: !!process.env?.SUPABASE_SERVICE_ROLE_KEY,
        envKeys: process.env ? Object.keys(process.env).filter(k => k.includes('SUPABASE')).map(k => k) : [],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Test DB error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal error',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};