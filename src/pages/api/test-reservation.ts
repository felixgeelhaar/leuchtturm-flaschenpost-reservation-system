import type { APIRoute } from 'astro';
import { createServerSupabaseClient } from '@/lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();
    
    console.log('Test reservation with body:', body);
    
    // Step 1: Check if user exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('email', body.email)
      .single();
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'user_check',
          error: userCheckError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    let userId = existingUser?.id;
    
    // Step 2: Create user if doesn't exist
    if (!userId) {
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: body.email,
          first_name: body.firstName,
          last_name: body.lastName,
          // phone column doesn't exist
          // phone: body.phone,
          consent_version: '1.0',
          data_retention_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      
      if (createUserError) {
        return new Response(
          JSON.stringify({
            success: false,
            step: 'user_creation',
            error: createUserError.message,
            details: createUserError,
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      userId = newUser.id;
    }
    
    // Step 3: Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        magazine_id: body.magazineId,
        quantity: body.quantity,
        delivery_method: body.deliveryMethod,
        pickup_location: body.pickupLocation,
        pickup_date: body.pickupDate,
        status: 'pending',
        reservation_date: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (reservationError) {
      return new Response(
        JSON.stringify({
          success: false,
          step: 'reservation_creation',
          error: reservationError.message,
          details: reservationError,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    // Step 4: Record consent
    const { error: consentError } = await supabase
      .from('user_consents')
      .insert({
        user_id: userId,
        consent_type: 'essential',
        consent_given: true,
        consent_version: '1.0',
      });
    
    if (consentError) {
      console.error('Consent error (non-fatal):', consentError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test reservation created successfully',
        reservationId: reservation.id,
        userId: userId,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
    
  } catch (error) {
    console.error('Test reservation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        step: 'exception',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};