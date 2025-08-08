// Test updated email templates with shipping costs and pickup message
import { config } from 'dotenv';
import type { Reservation, User, Magazine } from '../../src/types';

// Load environment variables
config();

// Import after loading env vars
import('../../src/lib/email/email-service.js').then(async ({ EmailService }) => {
  
  // Mock data for testing
  const mockUser: User = {
    id: 'test-user-1',
    email: process.env.SMTP_USER || 'test@example.com', // Use real email for testing
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consentVersion: '1.0',
    consentTimestamp: new Date().toISOString(),
    dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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
  
  // Test 1: Pickup reservation - should show "we'll contact you" message
  const pickupReservation: Reservation = {
    id: 'res-pickup-test',
    userId: 'test-user-1',
    magazineId: 'mag-1',
    quantity: 3, // 3 magazines = 7.50 EUR total
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'pickup',
    pickupLocation: 'Kindergarten Leuchtturm',
    pickupDate: null, // No specific date
    paymentMethod: null, // Cash on pickup
    orderGroupPicture: false,
    orderVorschulPicture: false,
    childIsVorschueler: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-1',
  };
  
  // Test 2: Shipping reservation - should include shipping costs
  const shippingReservation: Reservation = {
    id: 'res-shipping-test',
    userId: 'test-user-1',
    magazineId: 'mag-1',
    quantity: 2, // 2 magazines = 5.00 EUR + 1.80 EUR shipping = 6.80 EUR total
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'shipping',
    pickupLocation: null,
    pickupDate: null,
    paymentMethod: 'paypal',
    shippingAddress: {
      street: 'Teststraße',
      houseNumber: '42',
      postalCode: '80331',
      city: 'München',
      country: 'DE',
    },
    notes: 'Bitte klingeln',
    orderGroupPicture: false,
    orderVorschulPicture: false,
    childIsVorschueler: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-2',
  };
  
  async function testEmailTemplates() {
    console.log('Testing UPDATED email templates...\n');
    
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
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com',
      });
      
      // Test pickup reservation email
      console.log('1. Testing PICKUP reservation (3 magazines):');
      console.log('   Expected total: 3 × 2.50 EUR = 7.50 EUR');
      console.log('   Should show: "Wir melden uns in Kürze bezüglich eines Abholtermins"');
      console.log('   Should NOT show shipping costs\n');
      
      await emailService.sendReservationConfirmation({
        reservation: pickupReservation,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('✅ Pickup email sent to:', mockUser.email);
      
      // Wait a moment between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test shipping reservation email
      console.log('\n2. Testing SHIPPING reservation (2 magazines):');
      console.log('   Expected breakdown:');
      console.log('   - Magazines: 2 × 2.50 EUR = 5.00 EUR');
      console.log('   - Versandkostenpauschale: 1.80 EUR');
      console.log('   - Total: 6.80 EUR');
      console.log('   Should show PayPal.Me link for 6.80 EUR\n');
      
      await emailService.sendReservationConfirmation({
        reservation: shippingReservation,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('✅ Shipping email sent to:', mockUser.email);
      
      console.log('\n✅ All updated email templates tested successfully!');
      console.log('Please check the emails for:', mockUser.email);
      console.log('\nExpected results:');
      console.log('- Pickup: Total 7.50 EUR, message about contacting for pickup date');
      console.log('- Shipping: Total 6.80 EUR (5.00 + 1.80), with cost breakdown');
      
    } catch (error) {
      console.error('❌ Error testing email templates:', error);
    }
  }
  
  // Run tests
  testEmailTemplates();
}).catch(error => {
  console.error('Failed to import email service:', error);
});