// Test email templates to verify fixes
import { config } from 'dotenv';
import type { Reservation, User, Magazine } from './src/types';

// Load environment variables
config();

// Import after loading env vars
import('./src/lib/email/email-service.js')
  .then(async ({ EmailService }) => {
    // Mock data for testing
    const mockUser: User = {
      id: 'test-user-1',
      email: process.env.SMTP_USER || 'test@example.com', // Use real email for testing
      firstName: 'Max',
      lastName: 'Mustermann',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consentVersion: '1.0',
      consentTimestamp: new Date().toISOString(),
      dataRetentionUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };

    const mockMagazine: Magazine = {
      id: 'mag-1',
      title: 'Flaschenpost',
      issueNumber: '2024-01',
      publishDate: '2024-03-01',
      description: 'Test Magazine',
      totalCopies: 100,
      availableCopies: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test 1: Pickup reservation (should show "Abholung" and cash payment)
    const pickupReservation: Reservation = {
      id: 'res-pickup-1',
      userId: 'test-user-1',
      magazineId: 'mag-1',
      quantity: 2,
      status: 'confirmed',
      reservationDate: new Date().toISOString(),
      deliveryMethod: 'pickup', // PICKUP method
      pickupLocation: 'Kindergarten Leuchtturm',
      pickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: null, // NULL for pickup (cash payment)
      orderGroupPicture: true,
      childGroupName: 'Seesterne',
      childName: 'Emma Mustermann',
      orderVorschulPicture: false,
      childIsVorschueler: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consentReference: 'consent-1',
    };

    // Test 2: Shipping reservation (should show "Versand" and PayPal.Me link)
    const shippingReservation: Reservation = {
      id: 'res-shipping-1',
      userId: 'test-user-1',
      magazineId: 'mag-1',
      quantity: 1,
      status: 'confirmed',
      reservationDate: new Date().toISOString(),
      deliveryMethod: 'shipping', // SHIPPING method
      pickupLocation: null,
      pickupDate: null,
      paymentMethod: 'paypal', // PayPal for shipping
      shippingAddress: {
        street: 'Musterstraße',
        houseNumber: '123',
        postalCode: '12345',
        city: 'Musterstadt',
        country: 'DE',
      },
      notes: 'Bitte beim Nachbarn abgeben falls nicht zu Hause',
      orderGroupPicture: false,
      orderVorschulPicture: true,
      childIsVorschueler: true,
      childName: 'Max Mustermann Jr.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consentReference: 'consent-2',
    };

    async function testEmailTemplates() {
      console.log('Testing email templates...\n');

      try {
        // Initialize email service with config
        const emailService = new EmailService({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
          from:
            process.env.SMTP_FROM ||
            process.env.SMTP_USER ||
            'noreply@example.com',
        });

        // Test pickup reservation email
        console.log('1. Testing PICKUP reservation email:');
        console.log('   - Should show "Abholung" section');
        console.log('   - Should mention cash payment at pickup');
        console.log('   - Should NOT show PayPal information');
        console.log('   - Should NOT show phone number\n');

        await emailService.sendReservationConfirmation({
          reservation: pickupReservation,
          user: mockUser,
          magazine: mockMagazine,
        });

        console.log('✅ Pickup email sent to:', mockUser.email);

        // Wait a moment between emails
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Test shipping reservation email
        console.log('\n2. Testing SHIPPING reservation email:');
        console.log('   - Should show "Versand" section');
        console.log('   - Should show PayPal.Me link (not user email)');
        console.log('   - Should NOT show cash payment info');
        console.log('   - Should NOT show phone number\n');

        await emailService.sendReservationConfirmation({
          reservation: shippingReservation,
          user: mockUser,
          magazine: mockMagazine,
        });

        console.log('✅ Shipping email sent to:', mockUser.email);

        console.log('\n✅ All email templates tested successfully!');
        console.log('Please check the emails for:', mockUser.email);
        console.log('\nExpected results:');
        console.log('- Pickup email: Shows "Abholung" and cash payment info');
        console.log('- Shipping email: Shows "Versand" and PayPal.Me link');
        console.log('- Both emails: No phone number displayed');
      } catch (error) {
        console.error('❌ Error testing email templates:', error);
      }
    }

    // Run tests
    testEmailTemplates();
  })
  .catch((error) => {
    console.error('Failed to import email service:', error);
  });
