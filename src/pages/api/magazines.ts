import type { APIRoute } from 'astro';
import { DatabaseService } from '@/lib/database';

// Mark this route as server-side only (not to be prerendered)
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const db = new DatabaseService();
  
  try {
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    let magazines: import('@/types').Magazine[];
    
    try {
      // Try to get from database first
      await db.logDataProcessing({
        action: 'accessed',
        dataType: 'user_data', // magazines are public but we log access
        legalBasis: 'legitimate_interest',
        ipAddress: clientIP,
        details: JSON.stringify({ endpoint: '/api/magazines' }),
      });

      magazines = await db.getActiveMagazines();
    } catch (dbError) {
      console.error('Database not available:', dbError);
      // Return empty array - no mock data in production code
      magazines = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: magazines,
        count: magazines.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      },
    );

  } catch (error) {
    console.error('Error fetching magazines:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch magazines',
        message: 'Es ist ein Fehler beim Laden der Magazin-Ausgaben aufgetreten.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};