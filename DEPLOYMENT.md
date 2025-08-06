# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Supabase Account**: Create project at [supabase.com](https://supabase.com)
3. **Domain Name** (optional): For custom domain
4. **Environment Variables**: All required values from `.env.example`

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name: `flaschenpost-reservation`
   - Database password: (save securely)
   - Region: Choose closest to your users (e.g., Frankfurt for Germany)
4. Wait for project provisioning (~2 minutes)

### 1.2 Database Schema Setup

Execute in Supabase SQL Editor:

```sql
-- Create users table with GDPR compliance
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address_street VARCHAR(255),
  address_house_number VARCHAR(50),
  address_postal_code VARCHAR(20),
  address_city VARCHAR(100),
  address_country VARCHAR(2) DEFAULT 'DE',
  address_line2 VARCHAR(255),
  consent_version VARCHAR(50),
  consent_timestamp TIMESTAMPTZ,
  data_retention_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create magazines table
CREATE TABLE magazines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  issue_number VARCHAR(100) NOT NULL,
  publish_date DATE NOT NULL,
  description TEXT,
  total_copies INTEGER DEFAULT 100,
  available_copies INTEGER DEFAULT 100,
  cover_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  magazine_id UUID REFERENCES magazines(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  delivery_method VARCHAR(20) CHECK (delivery_method IN ('pickup', 'shipping')),
  pickup_location VARCHAR(255),
  pickup_date DATE,
  payment_method VARCHAR(20) DEFAULT 'paypal',
  payment_status VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending',
  reservation_date TIMESTAMPTZ DEFAULT NOW(),
  confirmation_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_consents table for GDPR
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(50) NOT NULL,
  ip_address INET,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID,
  ip_address INET,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_magazines_active ON magazines(is_active);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active magazines" ON magazines
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

### 1.3 Add Sample Magazine Data

```sql
INSERT INTO magazines (title, issue_number, publish_date, description, total_copies, available_copies, is_active)
VALUES 
  ('Flaschenpost Magazin', 'Ausgabe 2025/1', '2025-02-01', 'Winterausgabe mit spannenden Geschichten und Bastelanleitungen', 100, 95, true),
  ('Flaschenpost Magazin', 'Ausgabe 2025/2', '2025-04-01', 'Frühlingsausgabe mit Naturentdeckungen und Outdoor-Aktivitäten', 100, 100, true);
```

### 1.4 Get Supabase Credentials

From Supabase Dashboard > Settings > API:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret!)

## Step 2: Netlify Deployment

### 2.1 Deploy via GitHub

1. Push code to GitHub repository
2. Log in to [Netlify Dashboard](https://app.netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Choose GitHub and select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### 2.2 Environment Variables

In Netlify Dashboard > Site settings > Environment variables, add:

```bash
# Required
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Email (choose one provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.de

# Security
JWT_SECRET=generate-32-char-secret
SESSION_SECRET=generate-32-char-secret
ENCRYPTION_KEY=generate-32-char-secret
CSRF_SECRET=generate-32-char-secret

# Optional monitoring
SENTRY_DSN=your-sentry-dsn
```

### 2.3 Deploy

1. Click "Deploy site"
2. Wait for build completion (~2-3 minutes)
3. Test deployment at provided Netlify URL

## Step 3: Custom Domain (Optional)

### 3.1 Add Custom Domain

1. Netlify Dashboard > Domain settings
2. Add custom domain
3. Configure DNS:
   - Add CNAME record pointing to Netlify subdomain
   - Or use Netlify DNS

### 3.2 Enable HTTPS

1. Domain settings > HTTPS
2. Click "Verify DNS configuration"
3. "Provision certificate" (automatic with Let's Encrypt)

## Step 4: Post-Deployment Checklist

### 4.1 Functional Testing

- [ ] Homepage loads correctly
- [ ] Reservation form submits successfully
- [ ] Email notifications sent
- [ ] GDPR consent banner appears
- [ ] Privacy policy accessible
- [ ] Mobile responsive design works

### 4.2 Security Verification

- [ ] HTTPS enabled and forced
- [ ] Security headers present (check with securityheaders.com)
- [ ] Environment variables not exposed
- [ ] Rate limiting active
- [ ] CSRF protection working

### 4.3 Performance Check

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Images optimized
- [ ] Assets cached properly

### 4.4 GDPR Compliance

- [ ] Consent management functional
- [ ] Data export endpoint working
- [ ] Data deletion endpoint working
- [ ] Privacy policy current
- [ ] Cookie policy accurate

## Step 5: Monitoring Setup

### 5.1 Netlify Analytics

Enable in Netlify Dashboard > Analytics

### 5.2 Error Monitoring (Sentry)

1. Create project at [sentry.io](https://sentry.io)
2. Add `SENTRY_DSN` to environment variables
3. Test error reporting

### 5.3 Uptime Monitoring

1. Use service like UptimeRobot or Pingdom
2. Monitor `/api/health` endpoint
3. Set up alerts for downtime

## Troubleshooting

### Common Issues

**Build Fails**
- Check Node version (requires 18+)
- Verify all environment variables set
- Review build logs for specific errors

**Database Connection Issues**
- Verify Supabase credentials
- Check network access policies
- Ensure database schema created

**Email Not Sending**
- Verify SMTP credentials
- Check spam folder
- Test with different email provider

**Performance Issues**
- Enable Netlify caching
- Optimize images
- Review database queries
- Check for N+1 queries

## Maintenance

### Regular Tasks

**Weekly**
- Review error logs
- Check reservation metrics
- Monitor performance

**Monthly**
- Security updates (`npm audit`)
- Database backup
- Clean old reservations
- Review GDPR compliance

**Quarterly**
- Performance audit
- Security review
- Dependency updates
- User feedback review

## Rollback Procedure

If issues occur after deployment:

1. Netlify Dashboard > Deploys
2. Find last working deployment
3. Click "Publish deploy"
4. Investigate and fix issues
5. Deploy fix when ready

## Support Contacts

- **Technical Issues**: tech@your-domain.de
- **Privacy/GDPR**: privacy@your-domain.de
- **Netlify Support**: support.netlify.com
- **Supabase Support**: support.supabase.com

## Important URLs

- Production: https://your-domain.de
- Staging: https://staging--your-site.netlify.app
- Netlify Dashboard: https://app.netlify.com
- Supabase Dashboard: https://app.supabase.com
- GitHub Repository: https://github.com/your-org/repo

---

Last updated: January 2025