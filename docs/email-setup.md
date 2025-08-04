# Email Configuration Guide

This guide explains how to set up email functionality for the Flaschenpost Reservation System using Nodemailer.

## Overview

The system uses Nodemailer to send transactional emails for:
- Reservation confirmations (pickup and shipping)
- Reservation cancellations
- Pickup reminders

## Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@flaschenpost-magazin.de
```

### 2. Email Provider Options

#### Gmail (Recommended for Development)
1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-char-app-password
```

#### SendGrid (Recommended for Production)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailtrap (Development Testing)
```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

### 3. Testing Email Service

Run the test script to verify your configuration:

```bash
# Set test email recipient (optional)
export TEST_EMAIL=your-test-email@example.com

# Run email tests
npm run test:email
```

This will send test emails for:
- Pickup confirmation
- Shipping confirmation
- Reservation cancellation
- Pickup reminder

## Email Templates

The system includes both HTML and plain text versions of all emails:

### Reservation Confirmation
- Shows reservation details
- Includes pickup/shipping information
- Contains reservation ID and expiration date
- Provides next steps for the customer

### Cancellation Email
- Confirms reservation cancellation
- Includes reservation reference
- Provides contact information for questions

### Pickup Reminder
- Sent before pickup date
- Shows pickup location and time
- Includes reservation details

## Production Deployment

For Netlify deployment:

1. Add environment variables in Netlify dashboard:
   - Site settings → Environment variables
   - Add all SMTP_* variables

2. Use a production email service:
   - SendGrid, Mailgun, or AWS SES recommended
   - Avoid using Gmail for production

3. Configure SPF/DKIM records:
   - Add DNS records for email authentication
   - Improves deliverability

## Troubleshooting

### Connection Issues
- Verify SMTP credentials
- Check firewall/port restrictions
- Ensure correct SMTP_HOST and SMTP_PORT

### Authentication Errors
- For Gmail: Use app-specific password, not account password
- Verify SMTP_USER is correct
- Check if 2FA is enabled (required for Gmail)

### Emails Going to Spam
- Use a proper FROM address with your domain
- Configure SPF/DKIM records
- Avoid spam trigger words in content

### Testing Without Sending Emails
- Use Mailtrap or similar service
- Set up local SMTP server (maildev)
- Log emails to console in development

## Security Considerations

1. Never commit credentials to version control
2. Use environment variables for all sensitive data
3. Rotate SMTP passwords regularly
4. Monitor for bounce rates and spam reports
5. Implement rate limiting for email sending

## Support

For issues with email configuration:
1. Check the test script output
2. Review SMTP provider documentation
3. Verify all environment variables are set
4. Check application logs for detailed errors