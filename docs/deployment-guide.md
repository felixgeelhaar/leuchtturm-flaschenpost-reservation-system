# Deployment Guide - Flaschenpost Reservation System

This guide explains how to deploy the Flaschenpost Reservation System to Netlify.

## Prerequisites

- Netlify account
- GitHub repository with the code
- Supabase project set up
- SMTP credentials for email sending

## Deployment Steps

### 1. Connect to GitHub

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select the repository: `leuchtturm-flaschenpost-reservation-system`

### 2. Configure Build Settings

Netlify should automatically detect the build settings from `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18

If not detected, set these manually.

### 3. Set Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

#### Required Variables

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=your-supabase-project-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@flaschenpost-magazin.de

# Security Keys (generate secure random strings)
JWT_SECRET=your-32-char-random-string
SESSION_SECRET=your-32-char-random-string
ENCRYPTION_KEY=your-32-char-random-string
CSRF_SECRET=your-32-char-random-string

# Site Configuration
SITE_URL=https://your-site.netlify.app
NODE_ENV=production
```

#### Optional Variables

```bash
# Analytics (if using)
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_RESERVATIONS=true
ENABLE_ANALYTICS=false
MAINTENANCE_MODE=false

# GDPR Settings
DATA_RETENTION_DAYS=730
PRIVACY_CONTACT_EMAIL=privacy@flaschenpost-magazin.de
```

### 4. Deploy

1. Click "Deploy site"
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be available at: `https://[your-site-name].netlify.app`

### 5. Configure Custom Domain (Optional)

1. Go to Domain settings
2. Add custom domain
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic with Netlify)

### 6. Post-Deployment Checklist

- [ ] Test the reservation form
- [ ] Verify email sending works
- [ ] Check GDPR consent banner appears
- [ ] Test both pickup and shipping options
- [ ] Verify database connections
- [ ] Check security headers in browser dev tools
- [ ] Test on mobile devices

## Continuous Deployment

With GitHub integration, every push to the main branch will trigger a new deployment:

1. Make changes locally
2. Commit and push to GitHub
3. Netlify automatically rebuilds and deploys

## Environment-Specific Deployments

### Production
- Main branch deploys to production
- Uses production environment variables
- Full caching and optimization

### Preview Deployments
- Pull requests create preview deployments
- Separate URLs for testing
- Uses development environment variables

## Monitoring

### Build Logs
- Available in Netlify dashboard
- Shows build output and errors
- Helpful for debugging deployment issues

### Function Logs
- View serverless function execution
- Monitor API endpoint performance
- Track errors and timeouts

### Analytics
- Enable Netlify Analytics (paid feature)
- Or use Google Analytics with GA_MEASUREMENT_ID

## Troubleshooting

### Build Failures

1. **Module not found errors**
   - Run `npm install` locally
   - Commit `package-lock.json`
   - Clear Netlify cache and redeploy

2. **Environment variable issues**
   - Double-check all variables are set
   - No quotes needed in Netlify UI
   - Restart build after adding variables

3. **Astro build errors**
   - Check Node version matches local
   - Review build logs for specific errors
   - Test build locally with `npm run build`

### Runtime Issues

1. **API endpoints not working**
   - Check Supabase credentials
   - Verify CORS settings
   - Review function logs

2. **Emails not sending**
   - Verify SMTP credentials
   - Check spam folder
   - Test with email test script locally

3. **Database connection errors**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Review Supabase logs

## Security Considerations

1. **API Keys**
   - Never commit keys to repository
   - Use environment variables only
   - Rotate keys regularly

2. **CORS**
   - Configure allowed origins
   - Restrict API access
   - Use CSRF tokens

3. **Headers**
   - Security headers configured in netlify.toml
   - Review and update regularly
   - Test with security scanning tools

## Performance Optimization

1. **Caching**
   - Static assets cached for 1 year
   - API responses not cached
   - HTML revalidated on each request

2. **Compression**
   - Netlify automatically compresses assets
   - Images should be optimized before upload
   - Use WebP format when possible

3. **CDN**
   - Netlify provides global CDN
   - Assets served from edge locations
   - Reduces latency for users

## Backup and Recovery

1. **Database Backups**
   - Configure Supabase automatic backups
   - Download backups regularly
   - Test restore procedures

2. **Code Backups**
   - GitHub serves as code backup
   - Tag releases for easy rollback
   - Keep local backups of `.env` files

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Review security headers quarterly
- Test backup restoration annually

### Updates
1. Test updates locally first
2. Deploy to preview branch
3. Test thoroughly
4. Merge to main for production

## Support

For deployment issues:
1. Check Netlify status page
2. Review build logs
3. Search Netlify forums
4. Contact Netlify support (if on paid plan)

For application issues:
1. Check application logs
2. Review error tracking
3. Test in development environment
4. Debug with local reproduction