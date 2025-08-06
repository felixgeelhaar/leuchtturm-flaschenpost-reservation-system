import nodemailer from 'nodemailer';
import type { Reservation, Magazine, User } from '@/types';
import { paymentConfig, generatePaymentReference, formatCurrency, calculateTotalCost } from '@/config/payment';
import { kindergarten, magazine as magazineConfig, email as emailConfig } from '@/config/content';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Email template data interfaces
interface ReservationEmailData {
  reservation: Reservation;
  user: User;
  magazine: Magazine;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor(config?: EmailConfig) {
    // Use environment variables for configuration
    const emailConfig2 = config || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'noreply@example.com',
    };

    this.fromAddress = emailConfig2.from;

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: emailConfig2.host,
      port: emailConfig2.port,
      secure: emailConfig2.secure,
      auth: emailConfig2.auth,
      // Additional options for better deliverability
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send messages');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(data: ReservationEmailData): Promise<void> {
    const { reservation, user, magazine } = data;
    
    const subject = emailConfig.subjects.reservation;
    const html = this.generateReservationEmailHTML(data);
    const text = this.generateReservationEmailText(data);

    try {
      const info = await this.transporter.sendMail({
        from: `"${emailConfig.senderName}" <${this.fromAddress}>`,
        to: user.email,
        subject,
        text,
        html,
        headers: {
          'X-Priority': '3',
          'X-Mailer': `${kindergarten.name} Reservation System`,
        },
      });

      console.log('Reservation confirmation email sent:', info.messageId);
    } catch (error) {
      console.error('Failed to send reservation confirmation email:', error);
      throw new Error('Email konnte nicht gesendet werden');
    }
  }

  /**
   * Send reservation cancellation email
   */
  async sendReservationCancellation(data: ReservationEmailData): Promise<void> {
    const { magazine, user } = data;
    
    const subject = `Reservierung storniert: ${magazine.title} - ${magazine.issueNumber}`;
    const html = this.generateCancellationEmailHTML(data);
    const text = this.generateCancellationEmailText(data);

    try {
      await this.transporter.sendMail({
        from: `"${emailConfig.senderName}" <${this.fromAddress}>`,
        to: user.email,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      // Don't throw for cancellation emails - they're not critical
    }
  }

  /**
   * Send reminder email for pickup
   */
  async sendPickupReminder(data: ReservationEmailData): Promise<void> {
    const { reservation, magazine, user } = data;
    
    if (!reservation.pickupDate || !reservation.pickupLocation) {
      return; // Skip if no pickup details
    }

    const subject = `Erinnerung: Abholung ${magazine.title} - ${magazine.issueNumber}`;
    const html = this.generateReminderEmailHTML(data);
    const text = this.generateReminderEmailText(data);

    try {
      await this.transporter.sendMail({
        from: `"${emailConfig.senderName}" <${this.fromAddress}>`,
        to: user.email,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Failed to send reminder email:', error);
    }
  }

  /**
   * Generate HTML email for reservation confirmation
   */
  private generateReservationEmailHTML(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    const isShipping = reservation.deliveryMethod === 'shipping';
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservierungsbestätigung</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border: 1px solid #e9ecef;
      border-radius: 0 0 8px 8px;
    }
    .info-box {
      background-color: #e8f4f8;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .details {
      margin: 20px 0;
    }
    .details dt {
      font-weight: bold;
      color: #666;
      margin-top: 10px;
    }
    .details dd {
      margin: 5px 0 0 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color: #0066cc; margin: 0;">Reservierung bestätigt! 🎉</h1>
    <p style="margin: 10px 0 0 0; color: #666;">Vielen Dank für Ihre Reservierung</p>
  </div>
  
  <div class="content">
    <p>Liebe/r ${user.firstName} ${user.lastName},</p>
    
    <p>wir freuen uns, Ihnen mitteilen zu können, dass Ihre Reservierung für das <strong>${magazine.title}</strong> erfolgreich eingegangen ist.</p>
    
    <div class="info-box">
      <strong>Reservierungs-ID:</strong> ${reservation.id}<br>
      <strong>Status:</strong> Bestätigt ✓
    </div>
    
    <h2 style="color: #0066cc;">Ihre Reservierungsdetails:</h2>
    
    <dl class="details">
      <dt>Magazin:</dt>
      <dd>${magazine.title} - Ausgabe ${magazine.issueNumber}</dd>
      
      <dt>Anzahl:</dt>
      <dd>${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}</dd>
      
      <dt>Erhalt:</dt>
      <dd>${isShipping ? 'Versand nach Hause' : 'Abholung vor Ort'}</dd>
      
      ${!isShipping && reservation.pickupLocation ? `
        <dt>Abholort:</dt>
        <dd>${reservation.pickupLocation}</dd>
        
        ${reservation.pickupDate ? `
          <dt>Gewünschtes Abholdatum:</dt>
          <dd>${new Date(reservation.pickupDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</dd>
        ` : ''}
      ` : ''}
      
      ${isShipping && reservation.shippingAddress ? `
        <dt>Lieferadresse:</dt>
        <dd>
          ${reservation.shippingAddress.street} ${reservation.shippingAddress.houseNumber}<br>
          ${reservation.shippingAddress.addressLine2 ? reservation.shippingAddress.addressLine2 + '<br>' : ''}
          ${reservation.shippingAddress.postalCode} ${reservation.shippingAddress.city}<br>
          ${reservation.shippingAddress.country === 'DE' ? 'Deutschland' : 
            reservation.shippingAddress.country === 'AT' ? 'Österreich' : 'Schweiz'}
        </dd>
      ` : ''}
      
      ${reservation.notes ? `
        <dt>Ihre Anmerkungen:</dt>
        <dd>${reservation.notes}</dd>
      ` : ''}
    </dl>
    
    <h3 style="color: #0066cc;">Was passiert als Nächstes?</h3>
    
    ${isShipping ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #856404;">Zahlungsinformationen</h4>
        <div style="margin: 10px 0;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td>Magazin (1 Exemplar):</td>
              <td style="text-align: right;">${formatCurrency(paymentConfig.magazinePrice)}</td>
            </tr>
            <tr>
              <td>Versandkostenpauschale:</td>
              <td style="text-align: right;">${formatCurrency(paymentConfig.shippingCost)}</td>
            </tr>
            <tr style="border-top: 1px solid #dee2e6;">
              <td style="padding-top: 5px;"><strong>Gesamtbetrag:</strong></td>
              <td style="text-align: right; padding-top: 5px;"><strong>${formatCurrency(calculateTotalCost(true))}</strong></td>
            </tr>
          </table>
        </div>
        
        ${reservation.paymentMethod === 'paypal' ? `
          <p style="margin: 10px 0;">Sie haben PayPal als Zahlungsart gewählt.</p>
          <p style="margin: 10px 0;">Bitte zahlen Sie den Gesamtbetrag über folgenden Link:</p>
          <a href="${paymentConfig.paypal.paypalMeLink}/${calculateTotalCost(true)}EUR" 
             style="display: inline-block; padding: 10px 20px; background-color: #0070ba; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">
            Mit PayPal bezahlen
          </a>
          <p style="margin: 10px 0; font-size: 14px;">Verwendungszweck: ${generatePaymentReference(reservation.id)}</p>
        ` : `
          <p style="margin: 10px 0;">Sie haben Überweisung als Zahlungsart gewählt.</p>
          <p style="margin: 10px 0;">Bitte überweisen Sie den Gesamtbetrag auf folgendes Konto:</p>
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0;">
            <strong>Kontoinhaber:</strong> ${paymentConfig.bankTransfer.accountHolder}<br>
            <strong>IBAN:</strong> ${paymentConfig.bankTransfer.iban}<br>
            <strong>BIC:</strong> ${paymentConfig.bankTransfer.bic}<br>
            <strong>Bank:</strong> ${paymentConfig.bankTransfer.bankName}<br>
            <strong>Betrag:</strong> ${formatCurrency(calculateTotalCost(true))}<br>
            <strong>Verwendungszweck:</strong> ${generatePaymentReference(reservation.id)}
          </div>
        `}
        
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
          <strong>Wichtig:</strong> Das Magazin wird erst nach Zahlungseingang versandt.
        </p>
      </div>
    ` : `
      <p>Ihr Magazin liegt ab dem ${reservation.pickupDate ? 
        new Date(reservation.pickupDate).toLocaleDateString('de-DE') : 
        'vereinbarten Datum'} zur Abholung bereit. Bitte bringen Sie diese E-Mail oder Ihre Reservierungs-ID mit.</p>
      
      <p><strong>Abholzeiten:</strong><br>
      Montag - Freitag: 9:00 - 18:00 Uhr<br>
      Samstag: 10:00 - 14:00 Uhr</p>
    `}
    
    <div class="footer">
      <p><strong>Wichtige Hinweise:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Diese Reservierung ist ${reservation.expiresAt ? 
          `bis zum ${new Date(reservation.expiresAt).toLocaleDateString('de-DE')} gültig` : 
          '7 Tage gültig'}.</li>
        <li>Bei Fragen wenden Sie sich bitte an unseren Kundenservice.</li>
        <li>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</li>
      </ul>
      
      <p style="margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        <strong>${emailConfig.signature.name}</strong><br>
        ${emailConfig.signature.role}
      </p>
      
      <p style="font-size: 12px; color: #999; margin-top: 30px;">
        Datenschutz ist uns wichtig. Ihre Daten werden gemäß unserer Datenschutzerklärung verarbeitet.
        Sie können Ihre Einwilligungen jederzeit widerrufen.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for reservation confirmation
   */
  private generateReservationEmailText(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    const isShipping = reservation.deliveryMethod === 'shipping';
    
    let text = `
Reservierung bestätigt!

Liebe/r ${user.firstName} ${user.lastName},

wir freuen uns, Ihnen mitteilen zu können, dass Ihre Reservierung für das ${magazine.title} erfolgreich eingegangen ist.

RESERVIERUNGS-ID: ${reservation.id}
STATUS: Bestätigt

IHRE RESERVIERUNGSDETAILS:
-------------------------
Magazin: ${magazine.title} - Ausgabe ${magazine.issueNumber}
Anzahl: ${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}
Erhalt: ${isShipping ? 'Versand nach Hause' : 'Abholung vor Ort'}
`;

    if (isShipping) {
      text += `
\nZAHLUNGSINFORMATIONEN:
---------------------------------
Magazin (1 Exemplar): ${formatCurrency(paymentConfig.magazinePrice)}
Versandkostenpauschale: ${formatCurrency(paymentConfig.shippingCost)}
---------------------------------
GESAMTBETRAG: ${formatCurrency(calculateTotalCost(true))}

`;
      
      if (reservation.paymentMethod === 'paypal') {
        text += `Zahlungsart: PayPal
Bitte zahlen Sie über folgenden Link:
${paymentConfig.paypal.paypalMeLink}/${calculateTotalCost(true)}EUR
Verwendungszweck: ${generatePaymentReference(reservation.id)}\n`;
      } else {
        text += `Zahlungsart: Überweisung

Kontoinhaber: ${paymentConfig.bankTransfer.accountHolder}
IBAN: ${paymentConfig.bankTransfer.iban}
BIC: ${paymentConfig.bankTransfer.bic}
Bank: ${paymentConfig.bankTransfer.bankName}
Betrag: ${formatCurrency(calculateTotalCost(true))}
Verwendungszweck: ${generatePaymentReference(reservation.id)}\n`;
      }
      
      text += `\nWICHTIG: Das Magazin wird erst nach Zahlungseingang versandt.\n`;
    }

    if (!isShipping && reservation.pickupLocation) {
      text += `\nAbholort: ${reservation.pickupLocation}`;
      if (reservation.pickupDate) {
        text += `\nGewünschtes Abholdatum: ${new Date(reservation.pickupDate).toLocaleDateString('de-DE')}`;
      }
    }

    if (isShipping && reservation.shippingAddress) {
      text += `\n\nLieferadresse:
${reservation.shippingAddress.street} ${reservation.shippingAddress.houseNumber}
${reservation.shippingAddress.addressLine2 || ''}
${reservation.shippingAddress.postalCode} ${reservation.shippingAddress.city}
${reservation.shippingAddress.country}`;
    }

    if (reservation.notes) {
      text += `\n\nIhre Anmerkungen: ${reservation.notes}`;
    }

    text += `\n\nWAS PASSIERT ALS NÄCHSTES?
-------------------------\n`;

    if (isShipping) {
      text += 'Wir werden Ihr Magazin schnellstmöglich versenden. Sie erhalten eine weitere E-Mail mit den Versandinformationen.';
    } else {
      text += `Ihr Magazin liegt ab dem ${reservation.pickupDate ? 
        new Date(reservation.pickupDate).toLocaleDateString('de-DE') : 
        'vereinbarten Datum'} zur Abholung bereit.

Abholzeiten:
Montag - Freitag: 9:00 - 18:00 Uhr
Samstag: 10:00 - 14:00 Uhr`;
    }

    text += `\n\nWICHTIGE HINWEISE:
- Diese Reservierung ist ${reservation.expiresAt ? 
  `bis zum ${new Date(reservation.expiresAt).toLocaleDateString('de-DE')} gültig` : 
  '7 Tage gültig'}.
- Bei Fragen wenden Sie sich bitte an unseren Kundenservice.

Mit freundlichen Grüßen,
${emailConfig.signature.name}
${emailConfig.signature.role}

--
Datenschutz ist uns wichtig. Ihre Daten werden gemäß unserer Datenschutzerklärung verarbeitet.
`;

    return text;
  }

  /**
   * Generate HTML email for cancellation
   */
  private generateCancellationEmailHTML(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservierung storniert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #dc3545;">Reservierung storniert</h2>
  
  <p>Liebe/r ${user.firstName} ${user.lastName},</p>
  
  <p>Ihre Reservierung für <strong>${magazine.title} - Ausgabe ${magazine.issueNumber}</strong> wurde erfolgreich storniert.</p>
  
  <p><strong>Reservierungs-ID:</strong> ${reservation.id}</p>
  
  <p>Falls Sie dies nicht veranlasst haben oder Fragen haben, kontaktieren Sie bitte unseren Kundenservice.</p>
  
  <p>Mit freundlichen Grüßen,<br>
  Ihr Flaschenpost Team</p>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for cancellation
   */
  private generateCancellationEmailText(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    
    return `
Reservierung storniert

Liebe/r ${user.firstName} ${user.lastName},

Ihre Reservierung für ${magazine.title} - Ausgabe ${magazine.issueNumber} wurde erfolgreich storniert.

Reservierungs-ID: ${reservation.id}

Falls Sie dies nicht veranlasst haben oder Fragen haben, kontaktieren Sie bitte unseren Kundenservice.

Mit freundlichen Grüßen,
${emailConfig.signature.name}
${emailConfig.signature.role}
    `;
  }

  /**
   * Generate HTML email for pickup reminder
   */
  private generateReminderEmailHTML(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abholungserinnerung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #0066cc;">Erinnerung: Magazin abholen! 📚</h2>
  
  <p>Liebe/r ${user.firstName} ${user.lastName},</p>
  
  <p>dies ist eine freundliche Erinnerung, dass Ihr reserviertes Magazin <strong>${magazine.title} - Ausgabe ${magazine.issueNumber}</strong> zur Abholung bereit liegt.</p>
  
  <div style="background-color: #e8f4f8; padding: 15px; margin: 20px 0; border-left: 4px solid #0066cc;">
    <strong>Abholort:</strong> ${reservation.pickupLocation}<br>
    <strong>Datum:</strong> ${reservation.pickupDate ? new Date(reservation.pickupDate).toLocaleDateString('de-DE') : 'Heute'}<br>
    <strong>Reservierungs-ID:</strong> ${reservation.id}
  </div>
  
  <p><strong>Abholzeiten:</strong><br>
  Montag - Freitag: 9:00 - 18:00 Uhr<br>
  Samstag: 10:00 - 14:00 Uhr</p>
  
  <p>Bitte bringen Sie diese E-Mail oder Ihre Reservierungs-ID zur Abholung mit.</p>
  
  <p>Mit freundlichen Grüßen,<br>
  Ihr Flaschenpost Team</p>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for pickup reminder
   */
  private generateReminderEmailText(data: ReservationEmailData): string {
    const { reservation, user, magazine } = data;
    
    return `
Erinnerung: Magazin abholen!

Liebe/r ${user.firstName} ${user.lastName},

dies ist eine freundliche Erinnerung, dass Ihr reserviertes Magazin zur Abholung bereit liegt.

Magazin: ${magazine.title} - Ausgabe ${magazine.issueNumber}
Abholort: ${reservation.pickupLocation}
Datum: ${reservation.pickupDate ? new Date(reservation.pickupDate).toLocaleDateString('de-DE') : 'Heute'}
Reservierungs-ID: ${reservation.id}

Abholzeiten:
Montag - Freitag: 9:00 - 18:00 Uhr
Samstag: 10:00 - 14:00 Uhr

Bitte bringen Sie diese E-Mail oder Ihre Reservierungs-ID zur Abholung mit.

Mit freundlichen Grüßen,
${emailConfig.signature.name}
${emailConfig.signature.role}
    `;
  }
}

// Export singleton instance for API routes
export const emailService = new EmailService();