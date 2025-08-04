import type { APIRoute } from 'astro';
import { z } from 'zod';
import { DatabaseService } from '@/lib/database';
import { emailService } from '@/lib/email/email-service';
import type { ReservationFormData, ConsentData } from '@/types';

const db = new DatabaseService();

// Address validation schema
const addressSchema = z.object({
  street: z.string().min(1, 'Straße ist erforderlich').max(200, 'Straße ist zu lang').trim(),
  houseNumber: z.string().min(1, 'Hausnummer ist erforderlich').max(20, 'Hausnummer ist zu lang').trim(),
  postalCode: z.string().min(4, 'Postleitzahl muss mindestens 4 Zeichen lang sein').max(20, 'Postleitzahl ist zu lang').trim(),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100, 'Stadt ist zu lang').trim(),
  country: z.string().length(2, 'Ungültiger Ländercode').refine(val => ['DE', 'AT', 'CH'].includes(val), 'Land wird nicht unterstützt'),
  addressLine2: z.string().max(200, 'Adresszusatz ist zu lang').optional().transform(val => val?.trim() || undefined)
}).optional();

// Validation schema for reservation data
const reservationSchema = z.object({
  firstName: z.string()
    .min(2, 'Vorname muss mindestens 2 Zeichen lang sein')
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein')
    .trim(),
  lastName: z.string()
    .min(2, 'Nachname muss mindestens 2 Zeichen lang sein')
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein')
    .trim(),
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(254, 'E-Mail-Adresse ist zu lang')
    .toLowerCase()
    .trim(),
  phone: z.string()
    .transform(val => val.replace(/[\s\-\(\)]/g, '')) // Remove spaces, dashes, and parentheses
    .refine(val => !val || /^\+?[1-9]\d{1,14}$/.test(val), 'Bitte geben Sie eine gültige Telefonnummer ein')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
  magazineId: z.string()
    .uuid('Ungültige Magazin-ID')
    .min(1, 'Bitte wählen Sie eine Magazin-Ausgabe'),
  quantity: z.number()
    .int('Anzahl muss eine ganze Zahl sein')
    .min(1, 'Mindestens 1 Exemplar erforderlich')
    .max(5, 'Maximal 5 Exemplare pro Reservierung'),
  deliveryMethod: z.enum(['pickup', 'shipping'], {
    errorMap: () => ({ message: 'Ungültige Liefermethode' })
  }),
  pickupLocation: z.string()
    .max(200, 'Abholort ist zu lang')
    .optional(),
  pickupDate: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const pickupDate = new Date(date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return pickupDate >= tomorrow;
    }, 'Abholdatum muss mindestens einen Tag in der Zukunft liegen'),
  address: addressSchema,
  notes: z.string()
    .max(500, 'Anmerkungen dürfen maximal 500 Zeichen lang sein')
    .optional()
    .transform(val => val?.trim() || undefined),
  consents: z.object({
    essential: z.boolean().refine(val => val === true, 'Erforderliche Einwilligung muss erteilt werden'),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean()
  })
}).refine((data) => {
  // If pickup method, pickupLocation is required
  if (data.deliveryMethod === 'pickup') {
    return data.pickupLocation && data.pickupLocation.length > 0;
  }
  return true;
}, {
  message: 'Bitte wählen Sie einen Abholort',
  path: ['pickupLocation']
}).refine((data) => {
  // If shipping method, address is required
  if (data.deliveryMethod === 'shipping') {
    return data.address && 
           data.address.street && 
           data.address.houseNumber && 
           data.address.postalCode && 
           data.address.city && 
           data.address.country;
  }
  return true;
}, {
  message: 'Lieferadresse ist bei Versand erforderlich',
  path: ['address']
});

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per window

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP) || { count: 0, lastRequest: 0 };

  // Reset if window has passed
  if (now - clientData.lastRequest > RATE_LIMIT_WINDOW) {
    clientData.count = 0;
  }

  clientData.count++;
  clientData.lastRequest = now;
  rateLimitMap.set(clientIP, clientData);

  return clientData.count <= RATE_LIMIT_MAX;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get client information
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Zu viele Anfragen. Bitte versuchen Sie es in 15 Minuten erneut.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900' // 15 minutes
          }
        }
      );
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid content type',
          message: 'Content-Type muss application/json sein.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON',
          message: 'Ungültiger JSON-Body.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate data with Zod
    const validationResult = reservationSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: 'Eingabedaten sind ungültig.',
          errors
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const formData = validationResult.data as ReservationFormData;

    // Check if magazine exists and has available copies
    const magazine = await db.getMagazineById(formData.magazineId);
    if (!magazine) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Magazine not found',
          message: 'Die gewählte Magazin-Ausgabe ist nicht verfügbar.'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (magazine.availableCopies < formData.quantity) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient copies',
          message: `Nur noch ${magazine.availableCopies} Exemplare verfügbar.`
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user already exists
    let user = await db.getUserByEmail(formData.email);
    
    if (!user) {
      // Create new user
      user = await db.createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.deliveryMethod === 'shipping' ? formData.address : undefined,
        consentVersion: '1.0'
      });

      // Record initial consent
      await db.recordConsent(user.id, formData.consents, {
        ipAddress: clientIP,
        userAgent
      });
    } else {
      // Update existing user activity
      await db.updateUserActivity(user.id);

      // Update consent if different
      const existingConsents = await db.getUserConsents(user.id);
      const latestConsent = existingConsents[0];
      
      if (!latestConsent || 
          latestConsent.consentType !== 'essential' || 
          !latestConsent.consentGiven) {
        await db.recordConsent(user.id, formData.consents, {
          ipAddress: clientIP,
          userAgent
        });
      }
    }

    // Create reservation
    const reservation = await db.createReservation(formData);

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(user, reservation, magazine).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });

    // Log successful reservation
    await db.logDataProcessing({
      userId: user.id,
      action: 'reservation_created',
      dataType: 'reservation',
      legalBasis: 'consent',
      ipAddress: clientIP,
      details: JSON.stringify({
        reservationId: reservation.id,
        magazineTitle: magazine.title,
        quantity: formData.quantity
      })
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: reservation.id,
          status: reservation.status,
          expiresAt: reservation.expiresAt,
          magazine: {
            title: magazine.title,
            issueNumber: magazine.issueNumber
          }
        },
        message: 'Reservierung erfolgreich erstellt!'
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );

  } catch (error) {
    console.error('Reservation creation error:', error);

    // Log the error for monitoring
    await db.logDataProcessing({
      action: 'created',
      dataType: 'processing_log',
      legalBasis: 'legitimate_interest',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/reservations',
        method: 'POST'
      })
    }).catch(logError => {
      console.error('Failed to log error:', logError);
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Email notification function using the EmailService
async function sendConfirmationEmail(
  user: any, 
  reservation: any, 
  magazine: any
): Promise<void> {
  try {
    await emailService.sendReservationConfirmation({
      reservation,
      user,
      magazine
    });
    
    console.log(`Confirmation email sent to ${user.email} for reservation ${reservation.id}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// GET endpoint for retrieving user reservations (requires authentication)
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // This would require authentication in a real app
    // For demo purposes, we'll just return an empty array
    
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Log the access attempt
    await db.logDataProcessing({
      action: 'accessed',
      dataType: 'reservation',
      legalBasis: 'legitimate_interest',
      ipAddress: clientIP,
      details: JSON.stringify({ endpoint: '/api/reservations', method: 'GET' })
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: [],
        message: 'Authentication required for this endpoint'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error fetching reservations:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Es ist ein Fehler beim Laden der Reservierungen aufgetreten.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};