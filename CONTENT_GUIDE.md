# Content Configuration Guide

## Quick Start

All website content is centralized in `/src/config/content.ts`. This file contains all the text, information, and settings that need to be customized for your kindergarten's magazine reservation system.

## What You Need to Provide

### 🏫 1. Kindergarten Information
- Full name and description
- Contact details (email, phone, address)
- Responsible person for Impressum

### 📖 2. Magazine Details
- Magazine title and issue number
- Description and contents
- Publication date
- Physical specifications (already set to 44 pages, DIN A5, 130g)

### 💰 3. Payment Information
**Critical - Must be correct!**
- PayPal.Me username or PayPal email
- Bank account details (IBAN, BIC, account holder)
- Confirm prices: €5 magazine + €3 shipping = €8 total

### 📧 4. Email Configuration
- Sender email address
- Reply-to email address
- Contact person/team name

### 📸 5. Images to Upload
Place these in `/public/images/`:
- `magazine-cover.jpg` - Cover of the Flaschenpost magazine
- `leuchtturm-logo.png` - Your kindergarten logo (optional)
- `hero-image.jpg` - Main image for homepage (optional)

### ⚖️ 6. Legal Information (Required by German Law)
- Complete Impressum details
- Responsible person with full name
- Organization legal form (e.V., gGmbH, etc.)
- Registration details if applicable

## Step-by-Step Instructions

### Step 1: Edit Content File
1. Open `/src/config/content.ts`
2. Search for all `TODO:` markers
3. Replace each TODO with your actual information
4. Save the file

### Step 2: Update Payment Configuration
1. Open `/src/config/payment.ts`
2. Update the PayPal.Me link
3. Update bank account details
4. Confirm shipping cost (€3.00)
5. Confirm magazine price (€5.00)

### Step 3: Add Images
1. Add your images to `/public/images/`
2. Recommended sizes:
   - Magazine cover: 600x800px
   - Logo: 200x200px
   - Hero image: 1200x600px

### Step 4: Test Email Templates
The email templates will automatically use your content from the configuration.

## Important TODOs

### Must Have (Required)
- [ ] Kindergarten contact email
- [ ] PayPal username or email
- [ ] Bank account details (IBAN, BIC)
- [ ] Impressum information
- [ ] Magazine title and description

### Should Have (Recommended)
- [ ] Magazine cover image
- [ ] Kindergarten description
- [ ] FAQ answers
- [ ] Process explanation

### Nice to Have (Optional)
- [ ] Kindergarten logo
- [ ] Hero image
- [ ] Additional magazine content details

## Content Checklist

Before going live, ensure you have:

1. **Contact Information**
   - [ ] Email address for inquiries
   - [ ] Phone number (optional)
   - [ ] Physical address

2. **Payment Details**
   - [ ] PayPal.Me username
   - [ ] Complete bank details
   - [ ] Verified prices are correct

3. **Legal Compliance**
   - [ ] Complete Impressum
   - [ ] Responsible person named
   - [ ] Data protection contact

4. **Magazine Information**
   - [ ] Current issue details
   - [ ] Publication date
   - [ ] Brief description

5. **Images**
   - [ ] Magazine cover (recommended)
   - [ ] Logo (optional)

## Testing Your Content

After updating the content:

1. Run the development server: `npm run dev`
2. Check all pages display correctly
3. Submit a test reservation
4. Verify email content is correct
5. Check payment information is accurate

## Need Help?

If you're unsure about any content:
- Legal requirements: Consult your data protection officer
- Payment setup: Contact your financial administrator
- Technical issues: Check the main README.md

## Example Filled Content

Here's an example of how a section should look when completed:

```typescript
kindergarten: {
  name: 'BRK Haus für Kinder - Leuchtturm',
  shortName: 'Leuchtturm',
  description: 'Ein liebevoller Ort zum Spielen, Lernen und Wachsen für Kinder von 3-6 Jahren.',
  contact: {
    email: 'info@kita-leuchtturm.de',
    phone: '+49 89 12345678',
    address: {
      street: 'Beispielstraße 123',
      postalCode: '80331',
      city: 'München',
      country: 'Deutschland'
    }
  }
}
```

Remember: All fields marked with `TODO:` must be updated before the site can go live!