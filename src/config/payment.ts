// Payment Configuration for Magazine
import { pricing, payment } from './content';

export const paymentConfig = {
  // Magazine base price in euros
  magazinePrice: pricing.magazinePrice,
  
  // Shipping cost in euros
  shippingCost: pricing.shippingCost,
  
  // PayPal configuration
  paypal: {
    // PayPal.Me link from content config
    paypalMeLink: `https://paypal.me/${payment.paypal.username}`,
    // Or use email for PayPal payment
    paypalEmail: payment.paypal.email,
  },
  
  // Bank transfer configuration
  bankTransfer: {
    accountHolder: payment.bankTransfer.accountHolder,
    iban: payment.bankTransfer.iban,
    bic: payment.bankTransfer.bic,
    bankName: payment.bankTransfer.bankName,
    reference: payment.bankTransfer.referencePrefix, // Will append reservation ID
  },
  
  // Payment deadline (days after reservation)
  paymentDeadlineDays: 7,
  
  // Email templates
  emailTemplates: {
    paypal: {
      subject: 'Ihre Flaschenpost Magazin Reservierung - Zahlungsinformationen',
      body: `Vielen Dank für Ihre Reservierung!

Ihre Reservierungs-ID: {{reservationId}}
Gesamtbetrag: €{{totalCost}}

Bitte zahlen Sie den Gesamtbetrag über PayPal:
{{paypalLink}}

Verwendungszweck: Reservierung {{reservationId}}

Das Magazin wird nach Zahlungseingang versandt.

Mit freundlichen Grüßen
BRK Haus für Kinder - Leuchtturm`,
    },
    bankTransfer: {
      subject: 'Ihre Flaschenpost Magazin Reservierung - Zahlungsinformationen',
      body: `Vielen Dank für Ihre Reservierung!

Ihre Reservierungs-ID: {{reservationId}}
Gesamtbetrag: €{{totalCost}}

Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:

Kontoinhaber: {{accountHolder}}
IBAN: {{iban}}
BIC: {{bic}}
Bank: {{bankName}}
Betrag: €{{totalCost}}
Verwendungszweck: {{reference}}{{reservationId}}

Das Magazin wird nach Zahlungseingang versandt.

Mit freundlichen Grüßen
BRK Haus für Kinder - Leuchtturm`,
    },
    confirmation: {
      subject: 'Ihre Flaschenpost Magazin Reservierung - Bestätigung',
      body: `Vielen Dank für Ihre Reservierung!

Ihre Reservierungs-ID: {{reservationId}}

Sie haben sich für die Abholung vor Ort entschieden.
Abholort: BRK Haus für Kinder - Leuchtturm
Das Abholdatum wird Ihnen rechtzeitig mitgeteilt.

Mit freundlichen Grüßen
BRK Haus für Kinder - Leuchtturm`,
    },
  },
};

// Helper function to generate payment reference
export function generatePaymentReference(reservationId: string): string {
  return `FP-${reservationId.toUpperCase().slice(0, 8)}`;
}

// Helper function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Helper function to calculate total cost
export function calculateTotalCost(includeShipping: boolean = false): number {
  let total = paymentConfig.magazinePrice;
  if (includeShipping) {
    total += paymentConfig.shippingCost;
  }
  return total;
}

// Helper function to calculate payment deadline
export function calculatePaymentDeadline(reservationDate: Date): Date {
  const deadline = new Date(reservationDate);
  deadline.setDate(deadline.getDate() + paymentConfig.paymentDeadlineDays);
  return deadline;
}