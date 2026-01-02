import type { APIRoute } from "astro";
import { z } from "zod";
import { DatabaseService } from "@/lib/database";

// Mark this route as server-side only (not to be prerendered)
export const prerender = false;

const exportRequestSchema = z.object({
  userId: z.string().uuid("Ungültige Benutzer-ID"),
  requestTimestamp: z.string().datetime("Ungültiger Zeitstempel"),
});

export const POST: APIRoute = async ({ request }) => {
  const db = new DatabaseService();
  try {
    const body = await request.json();
    const validationResult = exportRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          message: "Ungültige Eingabedaten.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { userId } = validationResult.data;

    // Export user data
    const exportData = await db.exportUserData(userId);

    // Format export data for GDPR compliance
    const gdprExport = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        dataController: "Flaschenpost Magazin",
        contactEmail: "datenschutz@flaschenpost-magazin.de",
        purpose: "GDPR Article 20 - Right to data portability",
        format: "JSON",
        language: "de-DE",
      },
      personalData: exportData.userData,
      reservations: exportData.reservations,
      consents: exportData.consents,
      legalNotice: {
        de: "Diese Daten wurden auf Ihre Anfrage gemäß Art. 20 DSGVO exportiert. Die Daten werden in einem strukturierten, gängigen und maschinenlesbaren Format bereitgestellt.",
        en: "This data has been exported upon your request under Article 20 GDPR. The data is provided in a structured, commonly used and machine-readable format.",
      },
    };

    // Convert to JSON string for download
    const jsonString = JSON.stringify(gdprExport, null, 2);
    const buffer = Buffer.from(jsonString, "utf-8");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="datenexport-${userId}-${new Date().toISOString().split("T")[0]}.json"`,
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error) {
    console.error("Data export error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: "Fehler beim Exportieren der Daten.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
