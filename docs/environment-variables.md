# Environment Variables Configuration Guide

This guide provides detailed information about all environment variables required for the Flaschenpost Reservation System.

## Required Variables

### Database Configuration (Supabase)

#### `PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://xyzcompany.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Required**: Yes

#### `PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Public anonymous key for client-side Supabase access
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → anon/public
- **Required**: Yes
- **Security**: Safe to expose in client-side code

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Service role key for server-side Supabase operations
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → service_role
- **Required**: Yes
- **Security**: ⚠️ NEVER expose in client-side code

### Email Configuration (Nodemailer)

#### `SMTP_HOST`
- **Description**: SMTP server hostname
- **Examples**: 
  - Gmail: `smtp.gmail.com`
  - SendGrid: `smtp.sendgrid.net`
  - Mailgun: `smtp.mailgun.org`
- **Required**: Yes

#### `SMTP_PORT`
- **Description**: SMTP server port
- **Common values**:
  - `587` - TLS/STARTTLS (recommended)
  - `465` - SSL
  - `25` - Unencrypted (not recommended)
- **Required**: Yes

#### `SMTP_SECURE`
- **Description**: Use SSL/TLS for SMTP connection
- **Values**: `true` or `false`
- **Note**: Use `false` for port 587 (STARTTLS), `true` for port 465
- **Required**: Yes

#### `SMTP_USER`
- **Description**: SMTP authentication username
- **Examples**:
  - Gmail: Your full email address
  - SendGrid: `apikey`
  - Custom: Your SMTP username
- **Required**: Yes

#### `SMTP_PASS`
- **Description**: SMTP authentication password
- **Examples**:
  - Gmail: App-specific password (not your Gmail password)
  - SendGrid: Your API key
  - Custom: Your SMTP password
- **Required**: Yes
- **Security**: ⚠️ Keep secure

#### `SMTP_FROM`
- **Description**: Default "from" email address
- **Example**: `noreply@flaschenpost-magazin.de`
- **Note**: Some providers require this to be a verified address
- **Required**: Yes

### Security Keys

#### `JWT_SECRET`
- **Description**: Secret key for signing JWT tokens
- **Generation**: `openssl rand -base64 32`
- **Length**: Minimum 32 characters
- **Required**: Yes
- **Security**: ⚠️ Must be unique per environment

#### `SESSION_SECRET`
- **Description**: Secret key for session encryption
- **Generation**: `openssl rand -base64 32`
- **Length**: Minimum 32 characters
- **Required**: Yes
- **Security**: ⚠️ Must be unique per environment

#### `ENCRYPTION_KEY`
- **Description**: Key for encrypting sensitive data in database
- **Generation**: `openssl rand -base64 32`
- **Length**: Exactly 32 characters
- **Required**: Yes
- **Security**: ⚠️ Changing this will make existing encrypted data unreadable

#### `CSRF_SECRET`
- **Description**: Secret for CSRF token generation
- **Generation**: `openssl rand -base64 32`
- **Length**: Minimum 32 characters
- **Required**: Yes
- **Security**: ⚠️ Must be unique per environment

### Application Configuration

#### `SITE_URL`
- **Description**: Full URL of your deployed site
- **Examples**:
  - Netlify: `https://your-site.netlify.app`
  - Custom: `https://reservierung.flaschenpost-magazin.de`
- **Required**: Yes
- **Note**: No trailing slash

#### `NODE_ENV`
- **Description**: Application environment
- **Values**: `production`, `development`, `test`
- **Default**: `development`
- **Required**: No (set automatically by Netlify)

## Optional Variables

### Analytics and Monitoring

#### `GA_MEASUREMENT_ID`
- **Description**: Google Analytics 4 measurement ID
- **Example**: `G-XXXXXXXXXX`
- **Required**: No
- **Note**: Only set if you want analytics tracking

#### `SENTRY_DSN`
- **Description**: Sentry error tracking DSN
- **Example**: `https://abc123@o123456.ingest.sentry.io/123456`
- **Required**: No
- **Note**: Recommended for production error tracking

### Feature Flags

#### `ENABLE_REGISTRATION`
- **Description**: Enable/disable new reservations
- **Values**: `true` or `false`
- **Default**: `true`
- **Required**: No

#### `ENABLE_ANALYTICS`
- **Description**: Enable/disable analytics tracking
- **Values**: `true` or `false`
- **Default**: `false`
- **Required**: No

#### `MAINTENANCE_MODE`
- **Description**: Put site in maintenance mode
- **Values**: `true` or `false`
- **Default**: `false`
- **Required**: No

### GDPR Configuration

#### `DATA_RETENTION_DAYS`
- **Description**: Days to retain user data
- **Default**: `730` (2 years)
- **Required**: No

#### `PRIVACY_CONTACT_EMAIL`
- **Description**: Email for privacy inquiries
- **Example**: `privacy@flaschenpost-magazin.de`
- **Required**: No

#### `COOKIE_DOMAIN`
- **Description**: Domain for cookie scope
- **Example**: `.flaschenpost-magazin.de`
- **Required**: No

## Environment-Specific Settings

### Development
```env
NODE_ENV=development
SITE_URL=http://localhost:3000
# Use Mailtrap or similar for email testing
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
```

### Staging
```env
NODE_ENV=staging
SITE_URL=https://staging--your-site.netlify.app
ENABLE_ANALYTICS=false
```

### Production
```env
NODE_ENV=production
SITE_URL=https://your-site.netlify.app
ENABLE_ANALYTICS=true
MAINTENANCE_MODE=false
```

## Setting Variables in Netlify

1. **Navigate to Environment Variables**
   - Site settings → Environment variables

2. **Add Variables**
   - Click "Add a variable"
   - Choose scope (all deploys or specific context)
   - Enter key and value
   - No quotes needed around values

3. **Sensitive Variables**
   - Values are encrypted at rest
   - Not visible after saving
   - Can only be replaced, not viewed

4. **Scoped Variables**
   - "All scopes": Applies to all deployments
   - "Production": Only production branch
   - "Deploy previews": Only PR previews
   - "Branch deploys": Only non-production branches

## Generating Secure Keys

### Using OpenSSL (Recommended)
```bash
# Generate a 32-character key
openssl rand -base64 32

# Generate a 64-character key
openssl rand -base64 48
```

### Using Node.js
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Using Online Generators
- [RandomKeygen](https://randomkeygen.com/)
- [PasswordGenerator](https://passwordsgenerator.net/)
- ⚠️ Only use HTTPS sites and generate new keys after testing

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env` files locally
   - Add `.env` to `.gitignore`

2. **Use different keys per environment**
   - Don't reuse production keys in development
   - Rotate keys regularly

3. **Limit access**
   - Only give team members necessary access
   - Use Netlify's role-based access control

4. **Monitor usage**
   - Check for unauthorized access
   - Monitor email sending rates
   - Review error logs

## Troubleshooting

### Variable Not Found
- Ensure variable name matches exactly (case-sensitive)
- Restart build after adding variables
- Check variable scope matches deployment context

### Email Not Sending
- Verify SMTP credentials
- Check SMTP_SECURE matches port
- Test with email test script
- Check spam folder

### Database Connection Failed
- Verify Supabase URL includes `https://`
- Check both keys are set correctly
- Ensure Supabase project is active

### Build Failures
- All required variables must be set
- No syntax errors in values
- No trailing spaces in values

## Local Development

Create a `.env` file in project root:

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values
nano .env
```

Example `.env` for local development:
```env
PUBLIC_SUPABASE_URL=https://local-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
SMTP_FROM=test@example.com
JWT_SECRET=local-development-secret-change-in-production
SESSION_SECRET=local-development-secret-change-in-production
ENCRYPTION_KEY=local-development-key-32-chars!!
CSRF_SECRET=local-development-secret-change-in-production
SITE_URL=http://localhost:3000
NODE_ENV=development
```

## Variable Reference Table

| Variable | Required | Default | Environment | Security Level |
|----------|----------|---------|-------------|----------------|
| PUBLIC_SUPABASE_URL | Yes | - | All | Public |
| PUBLIC_SUPABASE_ANON_KEY | Yes | - | All | Public |
| SUPABASE_SERVICE_ROLE_KEY | Yes | - | All | Secret |
| SMTP_HOST | Yes | - | All | Private |
| SMTP_PORT | Yes | - | All | Private |
| SMTP_SECURE | Yes | - | All | Private |
| SMTP_USER | Yes | - | All | Secret |
| SMTP_PASS | Yes | - | All | Secret |
| SMTP_FROM | Yes | - | All | Private |
| JWT_SECRET | Yes | - | All | Secret |
| SESSION_SECRET | Yes | - | All | Secret |
| ENCRYPTION_KEY | Yes | - | All | Secret |
| CSRF_SECRET | Yes | - | All | Secret |
| SITE_URL | Yes | - | All | Public |
| NODE_ENV | No | development | All | Public |
| GA_MEASUREMENT_ID | No | - | Production | Public |
| SENTRY_DSN | No | - | Production | Private |
| ENABLE_REGISTRATION | No | true | All | Public |
| ENABLE_ANALYTICS | No | false | All | Public |
| MAINTENANCE_MODE | No | false | All | Public |
| DATA_RETENTION_DAYS | No | 730 | All | Public |
| PRIVACY_CONTACT_EMAIL | No | - | All | Public |

## Next Steps

1. Set all required variables in Netlify
2. Generate secure keys for production
3. Test email configuration
4. Verify database connection
5. Deploy and test thoroughly

For deployment instructions, see [Deployment Guide](./deployment-guide.md).