# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flaschenpost Magazine Reservation System** - A GDPR-compliant reservation website allowing parents to reserve copies of the Flaschenpost magazine. Built with Astro framework, Vue.js components, TypeScript, Tailwind CSS, and deployed on Netlify.

## Technology Stack

- **Framework**: Astro (hybrid rendering) with Vue.js components
- **Database**: Supabase (recommended over Astro DB for production)
- **Styling**: Tailwind CSS with mobile-first responsive design
- **Language**: TypeScript for type safety
- **Hosting**: Netlify with edge functions
- **Security**: GDPR compliance, CSRF protection, rate limiting

## Development Commands

```bash
# Project setup
npm create astro@latest -- --template minimal
npx astro add vue tailwind netlify

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run typecheck        # TypeScript type checking

# Database operations (if using Astro DB)
npm run db:push          # Push schema changes
npm run db:seed          # Seed development data

# Testing and quality
npm run test             # Run test suite
npm run test:e2e         # End-to-end tests with Playwright
npm run lint             # ESLint code linting
npm run format           # Prettier code formatting

# Security and compliance
npm audit                # Check for vulnerabilities
npm run security:scan    # Run security analysis
```

## Project Architecture

### Directory Structure

```
src/
├── components/          # Vue.js components
│   ├── ReservationForm.vue    # Main reservation form
│   ├── ConsentBanner.vue      # GDPR consent management
│   └── ErrorMessage.vue       # Reusable error display
├── pages/              # Astro pages and API routes
│   ├── index.astro           # Landing page
│   ├── privacy.astro         # Privacy policy
│   └── api/                  # API endpoints
│       ├── reservations.ts   # Reservation management
│       └── gdpr/            # GDPR compliance endpoints
├── lib/                # Utility libraries
│   ├── database.ts          # Database operations
│   ├── validation.ts        # Input validation
│   ├── gdpr-compliance.ts   # GDPR utilities
│   └── email.ts            # Email notifications
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind config
```

### Core Components

#### 1. Reservation Form (Vue.js)

- Mobile-first responsive design
- Real-time validation with Zod schema
- GDPR consent integration
- Accessible form controls (WCAG 2.1 AA)

#### 2. Database Schema (Supabase)

```sql
-- Users with GDPR compliance
users (
  id, email, first_name, last_name, phone,
  consent_version, consent_timestamp,
  data_retention_until, created_at
)

-- Reservations with audit trail
reservations (
  id, user_id, magazine_issue, quantity,
  status, reservation_date, pickup_date,
  consent_reference, created_at
)

-- GDPR consent tracking
user_consents (
  id, user_id, consent_type, consent_given,
  consent_version, timestamp, ip_address
)
```

#### 3. API Endpoints

- `POST /api/reservations` - Create new reservation
- `GET /api/reservations/:id` - Get reservation details
- `POST /api/gdpr/export` - Export user data
- `DELETE /api/gdpr/delete` - Delete user data
- `POST /api/gdpr/consent` - Update consent preferences

## GDPR Compliance Requirements

### Essential Implementation

1. **Consent Management**
   - Granular consent options (essential, functional, analytics)
   - Consent withdrawal mechanisms
   - Audit trail with IP and timestamp logging

2. **Data Rights**
   - Right to access (data export)
   - Right to rectification (data updates)
   - Right to erasure (data deletion)
   - Data portability in standard formats

3. **Data Protection**
   - Data minimization (collect only necessary data)
   - Automated retention policies (30 days post-distribution)
   - Encryption at rest and in transit
   - Regular security audits

### Privacy Policy Requirements

- Clear data usage explanation
- Cookie policy and management
- Contact information for data requests
- Legal basis for processing
- Third-party service disclosures

## Security Best Practices

### Input Validation

```typescript
import { z } from 'zod';

const reservationSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  quantity: z.number().min(1).max(5),
});
```

### API Security

- CSRF protection with tokens
- Rate limiting (10 requests per minute per IP)
- Input sanitization against XSS
- SQL injection prevention with parameterized queries
- Secure session management with HTTP-only cookies

### Environment Variables

```bash
# Database
PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Security
JWT_SECRET=32-character-secret
CSRF_SECRET=32-character-secret
ENCRYPTION_KEY=32-character-key

# Email service
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Testing Strategy

### Unit Tests

- Form validation logic
- API endpoint functionality
- GDPR compliance utilities
- Email notification system

### Integration Tests

- Database operations
- API request/response cycles
- Email delivery confirmation
- GDPR data export/deletion

### End-to-End Tests

- Complete reservation workflow
- Consent management flow
- Mobile responsive behavior
- Accessibility compliance

## Performance Optimization

### Core Web Vitals Targets

- First Contentful Paint: < 2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Implementation Strategies

- Image optimization (WebP/AVIF with fallbacks)
- Code splitting and lazy loading
- Critical CSS inlining
- Service worker for offline capability
- CDN optimization for static assets

## Deployment Configuration

### Netlify Settings

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### CI/CD Pipeline

- Automated testing on pull requests
- Security scanning with npm audit
- Performance testing with Lighthouse
- GDPR compliance validation
- Automated deployment to staging/production

## User Experience Guidelines

### Design Principles

- **Mobile-first**: Optimize for parent users on mobile devices
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Simplicity**: Maximum 2-minute reservation completion time
- **Transparency**: Clear privacy information and data usage

### Form UX Patterns

- Progressive disclosure for complex fields
- Real-time validation with helpful error messages
- Auto-save functionality for form persistence
- Clear success states and confirmation
- Accessible error handling and recovery

## Monitoring and Analytics

### Key Metrics

- Reservation conversion rate (target: >70%)
- Form abandonment rate (target: <20%)
- Page load performance (target: <3s)
- GDPR compliance audit results
- User satisfaction scores

### Error Tracking

- Sentry integration for error monitoring
- GDPR-compliant user session tracking
- Performance monitoring with Web Vitals
- Security incident logging and alerting

## Common Development Tasks

### Adding New Form Fields

1. Update TypeScript types in `src/types/`
2. Extend Zod validation schema
3. Update Vue.js form component
4. Add database migration if needed
5. Update API endpoint validation
6. Add corresponding tests

### GDPR Compliance Updates

1. Review legal requirements changes
2. Update consent management logic
3. Modify data retention policies
4. Update privacy policy documentation
5. Test data export/deletion functionality

### Performance Optimization

1. Analyze bundle size with `npm run analyze`
2. Optimize images and assets
3. Review and update caching strategies
4. Monitor Core Web Vitals
5. Implement performance budgets

## Troubleshooting

### Common Issues

- **Form submission failures**: Check CSRF token and rate limiting
- **Email delivery issues**: Verify SMTP configuration and DNS settings
- **Database connection errors**: Check Supabase credentials and network
- **GDPR compliance failures**: Review consent logging and data handling

### Debug Commands

```bash
# Check build issues
npm run build -- --verbose

# Database connection test
npm run db:test

# Security vulnerability scan
npm audit --audit-level high

# Performance analysis
npm run lighthouse
```

## Legal Compliance Checklist

- [ ] Privacy policy covers all data processing
- [ ] Cookie consent banner implemented
- [ ] GDPR consent tracking functional
- [ ] Data export functionality tested
- [ ] Data deletion procedures verified
- [ ] Retention policies automated
- [ ] Security measures documented
- [ ] Breach notification procedures defined

This architecture ensures a production-ready, GDPR-compliant magazine reservation system optimized for parent users with robust security, performance, and compliance features.
