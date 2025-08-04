#!/usr/bin/env node
/**
 * Test script for email service
 * Usage: npm run test:email
 */

import { EmailService } from '../src/lib/email/email-service';
import type { Reservation, User, Magazine } from '../src/types';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testEmailService() {
  console.log('🚀 Testing Email Service...\n');

  // Create test data
  const testUser: User = {
    id: 'test-user-123',
    email: process.env.TEST_EMAIL || 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+49123456789',
    address: {
      street: 'Teststraße',
      houseNumber: '123',
      postalCode: '10115',
      city: 'Berlin',
      country: 'DE',
      addressLine2: 'Apartment 5'
    },
    consentVersion: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testMagazine: Magazine = {
    id: 'test-magazine-123',
    title: 'Flaschenpost',
    issueNumber: '2024-01',
    description: 'Test Magazine Description',
    coverImageUrl: 'https://example.com/cover.jpg',
    availableCopies: 50,
    totalCopies: 100,
    releaseDate: new Date().toISOString(),
    reservationStartDate: new Date().toISOString(),
    reservationEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testReservationPickup: Reservation = {
    id: 'test-reservation-pickup-123',
    userId: testUser.id,
    magazineId: testMagazine.id,
    quantity: 2,
    status: 'pending',
    deliveryMethod: 'pickup',
    pickupLocation: 'Berlin Mitte - Hauptgeschäft',
    pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Bitte um Rückruf vor Abholung',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const testReservationShipping: Reservation = {
    id: 'test-reservation-shipping-456',
    userId: testUser.id,
    magazineId: testMagazine.id,
    quantity: 1,
    status: 'pending',
    deliveryMethod: 'shipping',
    shippingAddress: testUser.address,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Initialize email service
    const emailService = new EmailService();
    
    // Verify connection
    console.log('📧 Verifying email configuration...');
    const isConnected = await emailService.verifyConnection();
    if (!isConnected) {
      throw new Error('Could not connect to email server. Please check your SMTP configuration.');
    }
    console.log('✅ Email service connected successfully!\n');

    // Test 1: Pickup Confirmation Email
    console.log('📬 Test 1: Sending pickup confirmation email...');
    await emailService.sendReservationConfirmation({
      reservation: testReservationPickup,
      user: testUser,
      magazine: testMagazine
    });
    console.log('✅ Pickup confirmation email sent!\n');

    // Test 2: Shipping Confirmation Email
    console.log('📬 Test 2: Sending shipping confirmation email...');
    await emailService.sendReservationConfirmation({
      reservation: testReservationShipping,
      user: testUser,
      magazine: testMagazine
    });
    console.log('✅ Shipping confirmation email sent!\n');

    // Test 3: Cancellation Email
    console.log('📬 Test 3: Sending cancellation email...');
    await emailService.sendReservationCancellation({
      reservation: testReservationPickup,
      user: testUser,
      magazine: testMagazine
    });
    console.log('✅ Cancellation email sent!\n');

    // Test 4: Pickup Reminder Email
    console.log('📬 Test 4: Sending pickup reminder email...');
    await emailService.sendPickupReminder({
      reservation: testReservationPickup,
      user: testUser,
      magazine: testMagazine
    });
    console.log('✅ Pickup reminder email sent!\n');

    console.log('🎉 All email tests completed successfully!');
    console.log(`📨 Emails were sent to: ${testUser.email}`);
    console.log('\n⚠️  Note: Make sure to check your email inbox and spam folder.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your .env file has correct SMTP settings');
    console.log('2. For Gmail, use an app-specific password, not your regular password');
    console.log('3. Make sure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS are set');
    console.log('4. Set TEST_EMAIL environment variable to receive test emails');
    process.exit(1);
  }
}

// Run the test
testEmailService();