// Final test of all email templates before production push
import { config } from 'dotenv';
import type { Reservation, User, Magazine } from '../../src/types';

// Load environment variables
config();

// Import after loading env vars
import('../../src/lib/email/email-service.js').then(async ({ EmailService }) => {
  
  // Mock data for testing
  const mockUser: User = {
    id: 'test-user-final',
    email: process.env.SMTP_USER || 'test@example.com',
    firstName: 'Maria',
    lastName: 'Schmidt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consentVersion: '1.0',
    consentTimestamp: new Date().toISOString(),
    dataRetentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  const mockMagazine: Magazine = {
    id: 'mag-2024-01',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    publishDate: '2024-03-01',
    description: 'Abschlussmagazin 2024',
    totalCopies: 100,
    availableCopies: 50,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Test 1: Pickup with group picture
  const pickupWithPicture: Reservation = {
    id: 'res-final-pickup-1',
    userId: 'test-user-final',
    magazineId: 'mag-2024-01',
    quantity: 2,
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'pickup',
    pickupLocation: 'Kindergarten Leuchtturm',
    pickupDate: null,
    paymentMethod: null, // Cash on pickup
    orderGroupPicture: true,
    childGroupName: 'Seesterne',
    childName: 'Emma Schmidt',
    orderVorschulPicture: false,
    childIsVorschueler: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-final-1',
  };
  
  // Test 2: Shipping with Vorschüler picture
  const shippingWithVorschueler: Reservation = {
    id: 'res-final-ship-1',
    userId: 'test-user-final',
    magazineId: 'mag-2024-01',
    quantity: 1,
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'shipping',
    pickupLocation: null,
    pickupDate: null,
    paymentMethod: 'paypal',
    shippingAddress: {
      street: 'Leopoldstraße',
      houseNumber: '42',
      postalCode: '80802',
      city: 'München',
      country: 'DE',
    },
    notes: 'Bitte bei Nachbarn abgeben falls nicht da',
    orderGroupPicture: false,
    orderVorschulPicture: true,
    childIsVorschueler: true,
    childName: 'Max Schmidt',
    childGroupName: 'Delfine',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-final-2',
  };
  
  // Test 3: Simple pickup without pictures
  const simplePickup: Reservation = {
    id: 'res-final-pickup-2',
    userId: 'test-user-final',
    magazineId: 'mag-2024-01',
    quantity: 1,
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'pickup',
    pickupLocation: 'Kindergarten Leuchtturm',
    pickupDate: null,
    paymentMethod: null,
    orderGroupPicture: false,
    orderVorschulPicture: false,
    childIsVorschueler: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-final-3',
  };
  
  // Test 4: Shipping with multiple magazines
  const shippingMultiple: Reservation = {
    id: 'res-final-ship-2',
    userId: 'test-user-final',
    magazineId: 'mag-2024-01',
    quantity: 3,
    status: 'confirmed',
    reservationDate: new Date().toISOString(),
    deliveryMethod: 'shipping',
    pickupLocation: null,
    pickupDate: null,
    paymentMethod: 'paypal',
    shippingAddress: {
      street: 'Marienplatz',
      houseNumber: '1',
      postalCode: '80331',
      city: 'München',
      country: 'DE',
    },
    orderGroupPicture: false,
    orderVorschulPicture: false,
    childIsVorschueler: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    consentReference: 'consent-final-4',
  };
  
  async function testAllEmails() {
    console.log('🚀 FINAL EMAIL TEMPLATE TESTS\n');
    console.log('================================\n');
    
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
      
      // Test 1: Pickup with group picture
      console.log('📧 TEST 1: PICKUP with GROUP PICTURE');
      console.log('   Quantity: 2 magazines');
      console.log('   Expected: €5.00 total (2 × €2.50)');
      console.log('   Should show: Group picture order for Seesterne');
      console.log('   Should show: "Wir melden uns in Kürze bezüglich eines Abholtermins"');
      console.log('   Payment: Cash on pickup\n');
      
      await emailService.sendReservationConfirmation({
        reservation: pickupWithPicture,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('   ✅ Email sent successfully\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 2: Shipping with Vorschüler picture
      console.log('📧 TEST 2: SHIPPING with VORSCHÜLER PICTURE');
      console.log('   Quantity: 1 magazine');
      console.log('   Expected: €4.30 total (€2.50 + €1.80 shipping)');
      console.log('   Should show: Vorschüler picture order');
      console.log('   PayPal link: https://paypal.me/felixgeelhaar/4,30EUR');
      console.log('   Should include: Shipping address\n');
      
      await emailService.sendReservationConfirmation({
        reservation: shippingWithVorschueler,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('   ✅ Email sent successfully\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 3: Simple pickup
      console.log('📧 TEST 3: SIMPLE PICKUP (no pictures)');
      console.log('   Quantity: 1 magazine');
      console.log('   Expected: €2.50 total');
      console.log('   Should NOT show: Any picture orders');
      console.log('   Payment: Cash on pickup\n');
      
      await emailService.sendReservationConfirmation({
        reservation: simplePickup,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('   ✅ Email sent successfully\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test 4: Shipping with multiple magazines
      console.log('📧 TEST 4: SHIPPING MULTIPLE MAGAZINES');
      console.log('   Quantity: 3 magazines');
      console.log('   Expected breakdown:');
      console.log('     - Magazines: 3 × €2.50 = €7.50');
      console.log('     - Shipping: €1.80');
      console.log('     - Total: €9.30');
      console.log('   PayPal link: https://paypal.me/felixgeelhaar/9,30EUR\n');
      
      await emailService.sendReservationConfirmation({
        reservation: shippingMultiple,
        user: mockUser,
        magazine: mockMagazine,
      });
      
      console.log('   ✅ Email sent successfully\n');
      
      console.log('================================');
      console.log('✅ ALL EMAIL TESTS COMPLETED!\n');
      console.log('📬 Check emails at:', mockUser.email);
      console.log('\n📋 VERIFICATION CHECKLIST:');
      console.log('[ ] Pickup emails show "Wir melden uns in Kürze bezüglich eines Abholtermins"');
      console.log('[ ] Shipping emails show correct total with shipping costs');
      console.log('[ ] PayPal links include amount (e.g., /4,30EUR)');
      console.log('[ ] Picture orders are displayed correctly');
      console.log('[ ] No phone numbers appear in emails');
      console.log('[ ] Email formatting looks professional');
      console.log('\n🚀 Ready to push to production!');
      
    } catch (error) {
      console.error('❌ Error testing email templates:', error);
    }
  }
  
  // Run tests
  testAllEmails();
}).catch(error => {
  console.error('Failed to import email service:', error);
});