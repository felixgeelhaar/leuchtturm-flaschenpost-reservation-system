import type { APIRoute } from 'astro';
import { z } from 'zod';
import { DatabaseService } from '@/lib/database';
import type { ConsentData } from '@/types';

// Mark this route as server-side only (not to be prerendered)
export const prerender = false;

const db = new DatabaseService();

// Validation schema for consent data
const consentSchema = z.object({
  userId: z.string().uuid('Ungültige Benutzer-ID').optional(),
  consents: z.object({
    essential: z.boolean(),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
  timestamp: z.string().datetime('Ungültiger Zeitstempel'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON',
          message: 'Ungültiger JSON-Body.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Add client information to body if not present
    if (!body.ipAddress) body.ipAddress = clientIP;
    if (!body.userAgent) body.userAgent = userAgent;

    // Validate data
    const validationResult = consentSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: 'Eingabedaten sind ungültig.',
          errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { userId, consents, timestamp, ipAddress, userAgent: ua } = validationResult.data;

    // If no userId provided, this is anonymous consent tracking
    if (!userId) {
      // For anonymous consent, we just log the action
      await db.logDataProcessing({
        action: 'consent_given',
        dataType: 'consent',
        legalBasis: 'consent',
        ipAddress,
        details: JSON.stringify({
          consents,
          anonymous: true,
          timestamp,
        }),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Anonyme Einwilligung erfolgreich gespeichert.',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // For registered users, store consent in database
    await db.recordConsent(userId, consents, {
      ipAddress,
      userAgent: ua,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Einwilligung erfolgreich gespeichert.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Consent recording error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Fehler beim Speichern der Einwilligung.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

// Consent withdrawal endpoint
const withdrawalSchema = z.object({
  userId: z.string().uuid('Ungültige Benutzer-ID'),
  consentType: z.enum(['essential', 'functional', 'analytics', 'marketing']),
  timestamp: z.string().datetime('Ungültiger Zeitstempel'),
});

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validationResult = withdrawalSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: 'Ungültige Eingabedaten.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { userId, consentType } = validationResult.data;

    // Essential consent cannot be withdrawn
    if (consentType === 'essential') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot withdraw essential consent',
          message: 'Grundlegende Einwilligung kann nicht widerrufen werden.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    await db.withdrawConsent(userId, consentType);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${consentType} Einwilligung erfolgreich widerrufen.`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Consent withdrawal error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Fehler beim Widerrufen der Einwilligung.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

// Get user consents
export const GET: APIRoute = async ({ request, url }) => {
  try {
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userId parameter',
          message: 'Benutzer-ID ist erforderlich.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const consents = await db.getUserConsents(userId);

    return new Response(
      JSON.stringify({
        success: true,
        data: consents,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error fetching consents:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Fehler beim Laden der Einwilligungen.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};