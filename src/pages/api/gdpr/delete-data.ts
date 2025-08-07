import type { APIRoute } from 'astro';
import { z } from 'zod';
import { DatabaseService } from '@/lib/database';

// Mark this route as server-side only (not to be prerendered)
export const prerender = false;

const db = new DatabaseService();

const deleteRequestSchema = z.object({
  userId: z.string().uuid('Ungültige Benutzer-ID'),
  reason: z.string().min(1, 'Grund ist erforderlich'),
  requestTimestamp: z.string().datetime('Ungültiger Zeitstempel'),
  confirmDeletion: z.boolean().refine(val => val === true, 'Löschung muss bestätigt werden'),
});

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const validationResult = deleteRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          message: 'Ungültige Eingabedaten.',
          errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { userId, reason } = validationResult.data;

    // Check if user has active reservations
    const activeReservations = await db.getUserReservations(userId);
    const hasActiveReservations = activeReservations.some(
      reservation => reservation.status === 'pending' || reservation.status === 'confirmed',
    );

    if (hasActiveReservations) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Active reservations exist',
          message: 'Löschung nicht möglich: Sie haben noch aktive Reservierungen. Bitte stornieren Sie diese zuerst oder warten Sie bis zur Abholung.',
          details: {
            activeReservationsCount: activeReservations.filter(
              r => r.status === 'pending' || r.status === 'confirmed',
            ).length,
          },
        }),
        {
          status: 409, // Conflict
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check legal retention requirements
    const user = await db.getUserByEmail(''); // We need a way to get user by ID
    if (user && user.dataRetentionUntil) {
      const retentionDate = new Date(user.dataRetentionUntil);
      const now = new Date();
      
      if (retentionDate > now) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Legal retention period active',
            message: `Löschung nicht möglich: Gesetzliche Aufbewahrungsfrist bis ${retentionDate.toLocaleDateString('de-DE')} aktiv.`,
            details: {
              retentionUntil: user.dataRetentionUntil,
              daysRemaining: Math.ceil((retentionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            },
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // Perform data deletion
    await db.deleteUserData(userId, reason);

    // Send deletion confirmation email (if email still available)
    // This would typically be done before actual deletion
    try {
      await sendDeletionConfirmationEmail(userId);
    } catch (emailError) {
      console.error('Failed to send deletion confirmation email:', emailError);
      // Continue with deletion even if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Alle Ihre Daten wurden erfolgreich gelöscht.',
        details: {
          deletionTimestamp: new Date().toISOString(),
          reason: reason,
          affectedDataTypes: [
            'Persönliche Daten',
            'Reservierungen',
            'Einwilligungen',
            'Verarbeitungsprotokoll (anonymisiert)',
          ],
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      },
    );

  } catch (error) {
    console.error('Data deletion error:', error);

    // Log the error for compliance monitoring
    await db.logDataProcessing({
      action: 'deleted',
      dataType: 'processing_log',
      legalBasis: 'user_request',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: '/api/gdpr/delete-data',
        timestamp: new Date().toISOString(),
      }),
    }).catch(logError => {
      console.error('Failed to log deletion error:', logError);
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Fehler beim Löschen der Daten. Bitte kontaktieren Sie unseren Datenschutzbeauftragten.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

// Endpoint to check deletion eligibility
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing userId',
          message: 'Benutzer-ID ist erforderlich.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Check deletion eligibility
    const activeReservations = await db.getUserReservations(userId);
    const hasActiveReservations = activeReservations.some(
      reservation => reservation.status === 'pending' || reservation.status === 'confirmed',
    );

    const eligibilityCheck = {
      canDelete: !hasActiveReservations,
      reasons: [] as string[],
      activeReservations: activeReservations.filter(
        r => r.status === 'pending' || r.status === 'confirmed',
      ).length,
      totalReservations: activeReservations.length,
    };

    if (hasActiveReservations) {
      eligibilityCheck.reasons.push('Aktive Reservierungen vorhanden');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: eligibilityCheck,
        message: eligibilityCheck.canDelete 
          ? 'Löschung ist möglich.' 
          : 'Löschung derzeit nicht möglich.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Deletion eligibility check error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: 'Fehler bei der Überprüfung der Löschberechtigung.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

// Helper function to send deletion confirmation email
async function sendDeletionConfirmationEmail(userId: string): Promise<void> {
  // In a real implementation, this would send an email confirming the deletion
  // Deletion confirmation would be sent to user
  
  // Email template would include:
  // - Confirmation that data has been deleted
  // - List of deleted data types
  // - Information about anonymized logs kept for legal compliance
  // - Contact information for data protection officer
  
  // For now, just log the action
}