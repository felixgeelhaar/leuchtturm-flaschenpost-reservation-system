import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const email = url.searchParams.get('email');
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabase = createServerSupabaseClient();
    
    // Get reservation details
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        delivery_method,
        payment_method,
        pickup_location,
        pickup_date,
        quantity,
        order_group_picture,
        child_group_name,
        order_vorschul_picture,
        child_is_vorschueler,
        child_name,
        status,
        users!inner(email)
      `)
      .eq('users.email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          code: error.code 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reservation: data,
        analysis: {
          paymentMethodCorrect: data?.delivery_method === 'pickup' ? data?.payment_method === null : data?.payment_method === 'paypal',
          pictureFieldsStored: {
            groupPicture: data?.order_group_picture,
            groupName: data?.child_group_name,
            vorschulPicture: data?.order_vorschul_picture,
            isVorschueler: data?.child_is_vorschueler,
            childName: data?.child_name
          }
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};