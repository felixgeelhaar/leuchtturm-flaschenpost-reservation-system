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
    // In Netlify functions, process.env is the correct way
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

    // Check if SMTP credentials are configured
    if (!emailConfig2.auth.user || !emailConfig2.auth.pass) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    // Create transporter - simple configuration that works with Gmail
    if (emailConfig2.host.includes('gmail')) {
      // Use Gmail service mode which handles all the configuration
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailConfig2.auth.user,
          pass: emailConfig2.auth.pass,
        },
      });
    } else {
      // Generic SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: emailConfig2.host,
        port: emailConfig2.port,
        secure: emailConfig2.secure,
        auth: emailConfig2.auth,
      });
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
    } catch (error) {
      throw new Error(`Email service verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(data: ReservationEmailData): Promise<void> {
    const { reservation, user, magazine } = data;
    
    // Generate email content
    const subject = `Reservierungsbestätigung - ${magazine.title}`;
    const html = this.generateReservationEmailHTML(reservation, user, magazine);
    const text = this.generateReservationEmailText(reservation, user, magazine);

    // Prepare email options
    const mailOptions = {
      from: `${kindergarten.name} <${this.fromAddress}>`,
      to: user.email,
      subject,
      html,
      text,
      headers: {
        'X-Reservation-ID': reservation.id,
        'X-Priority': '1',
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(data: ReservationEmailData): Promise<void> {
    const { reservation, user, magazine } = data;
    
    const subject = `Reservierung storniert - ${magazine.title}`;
    const html = this.generateCancellationEmailHTML(reservation, user, magazine);
    const text = this.generateCancellationEmailText(reservation, user, magazine);

    const mailOptions = {
      from: `${kindergarten.name} <${this.fromAddress}>`,
      to: user.email,
      subject,
      html,
      text,
      headers: {
        'X-Reservation-ID': reservation.id,
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Cancellation email sent:', info.messageId);
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
      throw new Error(`Failed to send cancellation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send pickup reminder email
   */
  async sendPickupReminder(data: ReservationEmailData): Promise<void> {
    const { reservation, user, magazine } = data;
    
    const subject = `Erinnerung: Abholung ${magazine.title}`;
    const html = this.generateReminderEmailHTML(reservation, user, magazine);
    const text = this.generateReminderEmailText(reservation, user, magazine);

    const mailOptions = {
      from: `${kindergarten.name} <${this.fromAddress}>`,
      to: user.email,
      subject,
      html,
      text,
      headers: {
        'X-Reservation-ID': reservation.id,
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Reminder email sent:', info.messageId);
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      throw new Error(`Failed to send reminder email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML email for reservation confirmation
   */
  private generateReservationEmailHTML(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    const pickupDate = reservation.pickupDate 
      ? new Date(reservation.pickupDate).toLocaleDateString('de-DE', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      : 'Nach Ankündigung';

    const totalCost = calculateTotalCost(reservation.quantity);
    const paymentReference = generatePaymentReference(reservation.id);

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
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0066cc;
    }
    .header h1 {
      color: #0066cc;
      margin: 0;
      font-size: 28px;
    }
    .kindergarten-name {
      color: #666;
      font-size: 18px;
      margin-top: 5px;
    }
    .content {
      margin: 30px 0;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    .info-value {
      color: #333;
    }
    .payment-info {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
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
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .important {
      color: #d9534f;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reservierung bestätigt!</h1>
      <div class="kindergarten-name">${kindergarten.name}</div>
    </div>
    
    <div class="content">
      <p>Hallo ${user.firstName} ${user.lastName},</p>
      
      <p>vielen Dank für Ihre Reservierung der <strong>${magazine.title}</strong>.</p>
      
      <div class="info-box">
        <h3>Reservierungsdetails:</h3>
        <div class="info-row">
          <span class="info-label">Reservierungsnummer:</span>
          <span class="info-value">${reservation.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Magazin:</span>
          <span class="info-value">${magazine.title} - ${magazine.issueNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Anzahl:</span>
          <span class="info-value">${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Preis pro Exemplar:</span>
          <span class="info-value">${formatCurrency(magazineConfig.price)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Gesamtpreis:</span>
          <span class="info-value"><strong>${formatCurrency(totalCost)}</strong></span>
        </div>
      </div>

      ${reservation.deliveryMethod === 'pickup' ? `
        <div class="info-box">
          <h3>Abholung:</h3>
          <div class="info-row">
            <span class="info-label">Ort:</span>
            <span class="info-value">${reservation.pickupLocation}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Datum:</span>
            <span class="info-value">${pickupDate}</span>
          </div>
        </div>
        
        <div class="payment-info">
          <h3>💰 Zahlungsinformationen</h3>
          <p><strong>Bitte bezahlen Sie bei der Abholung in bar.</strong></p>
          <p>Betrag: <strong>${formatCurrency(totalCost)}</strong></p>
          <p class="important">Bitte bringen Sie den passenden Betrag mit.</p>
        </div>
      ` : `
        <div class="info-box">
          <h3>Versand:</h3>
          <p>Die Lieferadresse wurde gespeichert. Die Versandkosten werden separat berechnet.</p>
        </div>
        
        ${reservation.paymentMethod === 'paypal' ? `
          <div class="payment-info">
            <h3>💳 PayPal-Zahlung</h3>
            <p>Bitte überweisen Sie den Betrag von <strong>${formatCurrency(totalCost)}</strong> an:</p>
            <p>
              <strong>PayPal:</strong> ${paymentConfig.paypalEmail}<br>
              <strong>Verwendungszweck:</strong> ${paymentReference}
            </p>
            <p class="important">Bitte geben Sie unbedingt den Verwendungszweck an!</p>
          </div>
        ` : ''}
      `}

      ${reservation.orderGroupPicture || reservation.orderVorschulPicture ? `
        <div class="info-box">
          <h3>📸 Bildbestellung:</h3>
          ${reservation.orderGroupPicture ? `
            <div class="info-row">
              <span class="info-label">Gruppenbild:</span>
              <span class="info-value">✓ Bestellt (${reservation.childGroupName})</span>
            </div>
          ` : ''}
          ${reservation.orderVorschulPicture ? `
            <div class="info-row">
              <span class="info-label">Vorschüler-Bild:</span>
              <span class="info-value">✓ Bestellt</span>
            </div>
          ` : ''}
          ${reservation.childName ? `
            <div class="info-row">
              <span class="info-label">Kind:</span>
              <span class="info-value">${reservation.childName}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <p>Bei Fragen können Sie uns gerne kontaktieren:</p>
      <ul>
        <li>E-Mail: <a href="mailto:${emailConfig.contact}">${emailConfig.contact}</a></li>
        <li>Telefon: ${kindergarten.phone}</li>
      </ul>
    </div>
    
    <div class="footer">
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
      <p>${kindergarten.name}<br>
      ${kindergarten.address.street} ${kindergarten.address.houseNumber}<br>
      ${kindergarten.address.postalCode} ${kindergarten.address.city}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for reservation confirmation
   */
  private generateReservationEmailText(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    const pickupDate = reservation.pickupDate 
      ? new Date(reservation.pickupDate).toLocaleDateString('de-DE')
      : 'Nach Ankündigung';

    const totalCost = calculateTotalCost(reservation.quantity);
    const paymentReference = generatePaymentReference(reservation.id);

    let text = `
Reservierung bestätigt!
======================

Hallo ${user.firstName} ${user.lastName},

vielen Dank für Ihre Reservierung der ${magazine.title}.

RESERVIERUNGSDETAILS:
--------------------
Reservierungsnummer: ${reservation.id.slice(0, 8).toUpperCase()}
Magazin: ${magazine.title} - ${magazine.issueNumber}
Anzahl: ${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}
Preis pro Exemplar: ${formatCurrency(magazineConfig.price)}
Gesamtpreis: ${formatCurrency(totalCost)}
`;

    if (reservation.deliveryMethod === 'pickup') {
      text += `
ABHOLUNG:
---------
Ort: ${reservation.pickupLocation}
Datum: ${pickupDate}

ZAHLUNG:
--------
Bitte bezahlen Sie bei der Abholung in bar.
Betrag: ${formatCurrency(totalCost)}
WICHTIG: Bitte bringen Sie den passenden Betrag mit.
`;
    } else {
      text += `
VERSAND:
--------
Die Lieferadresse wurde gespeichert.
Die Versandkosten werden separat berechnet.
`;
      if (reservation.paymentMethod === 'paypal') {
        text += `
PAYPAL-ZAHLUNG:
--------------
Bitte überweisen Sie ${formatCurrency(totalCost)} an:
PayPal: ${paymentConfig.paypalEmail}
Verwendungszweck: ${paymentReference}
WICHTIG: Bitte geben Sie unbedingt den Verwendungszweck an!
`;
      }
    }

    if (reservation.orderGroupPicture || reservation.orderVorschulPicture) {
      text += `
BILDBESTELLUNG:
--------------`;
      if (reservation.orderGroupPicture) {
        text += `
Gruppenbild: ✓ Bestellt (${reservation.childGroupName})`;
      }
      if (reservation.orderVorschulPicture) {
        text += `
Vorschüler-Bild: ✓ Bestellt`;
      }
      if (reservation.childName) {
        text += `
Kind: ${reservation.childName}`;
      }
    }

    text += `

Bei Fragen können Sie uns gerne kontaktieren:
E-Mail: ${emailConfig.contact}
Telefon: ${kindergarten.phone}

Mit freundlichen Grüßen
${kindergarten.name}
${kindergarten.address.street} ${kindergarten.address.houseNumber}
${kindergarten.address.postalCode} ${kindergarten.address.city}
`;

    return text;
  }

  /**
   * Generate HTML email for cancellation
   */
  private generateCancellationEmailHTML(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservierung storniert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #d9534f;">Reservierung storniert</h1>
    <p>Hallo ${user.firstName} ${user.lastName},</p>
    <p>Ihre Reservierung für die <strong>${magazine.title}</strong> wurde erfolgreich storniert.</p>
    <p>Reservierungsnummer: ${reservation.id.slice(0, 8).toUpperCase()}</p>
    <p>Falls Sie Fragen haben, kontaktieren Sie uns bitte unter ${emailConfig.contact}.</p>
    <p>Mit freundlichen Grüßen<br>${kindergarten.name}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for cancellation
   */
  private generateCancellationEmailText(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    return `
Reservierung storniert
=====================

Hallo ${user.firstName} ${user.lastName},

Ihre Reservierung für die ${magazine.title} wurde erfolgreich storniert.

Reservierungsnummer: ${reservation.id.slice(0, 8).toUpperCase()}

Falls Sie Fragen haben, kontaktieren Sie uns bitte unter ${emailConfig.contact}.

Mit freundlichen Grüßen
${kindergarten.name}
`;
  }

  /**
   * Generate HTML email for pickup reminder
   */
  private generateReminderEmailHTML(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    const pickupDate = reservation.pickupDate 
      ? new Date(reservation.pickupDate).toLocaleDateString('de-DE')
      : 'heute';

    return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abholung Erinnerung</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #0066cc;">Erinnerung: Abholung ${magazine.title}</h1>
    <p>Hallo ${user.firstName} ${user.lastName},</p>
    <p>Dies ist eine freundliche Erinnerung, dass Sie ${pickupDate} Ihre reservierte <strong>${magazine.title}</strong> abholen können.</p>
    <p><strong>Abholort:</strong> ${reservation.pickupLocation}</p>
    <p><strong>Anzahl:</strong> ${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}</p>
    <p>Bitte denken Sie daran, den Betrag in bar mitzubringen.</p>
    <p>Mit freundlichen Grüßen<br>${kindergarten.name}</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for pickup reminder
   */
  private generateReminderEmailText(
    reservation: Reservation,
    user: User,
    magazine: Magazine,
  ): string {
    const pickupDate = reservation.pickupDate 
      ? new Date(reservation.pickupDate).toLocaleDateString('de-DE')
      : 'heute';

    return `
Erinnerung: Abholung ${magazine.title}
=====================================

Hallo ${user.firstName} ${user.lastName},

Dies ist eine freundliche Erinnerung, dass Sie ${pickupDate} Ihre reservierte ${magazine.title} abholen können.

Abholort: ${reservation.pickupLocation}
Anzahl: ${reservation.quantity} ${reservation.quantity === 1 ? 'Exemplar' : 'Exemplare'}

Bitte denken Sie daran, den Betrag in bar mitzubringen.

Mit freundlichen Grüßen
${kindergarten.name}
`;
  }
}

// Export singleton instance - will throw error if SMTP not configured
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    try {
      emailServiceInstance = new EmailService();
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }
  return emailServiceInstance;
};

// Export for backward compatibility - but will throw if not configured
export const emailService = (() => {
  try {
    return getEmailService();
  } catch (error) {
    console.error('Email service not available:', error);
    // Return a stub that throws meaningful errors
    return {
      sendReservationConfirmation: async () => {
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
      },
      sendCancellationConfirmation: async () => {
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
      },
      sendPickupReminder: async () => {
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
      },
      verifyConnection: async () => {
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
      },
    };
  }
})();