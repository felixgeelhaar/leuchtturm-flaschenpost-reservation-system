# Netlify Environment Variables Update

## Required Environment Variables

Please add or update the following environment variables in your Netlify project settings:

### SMTP Configuration (Email Service)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=leuchtturm.elternbeirat@gmail.com
SMTP_PASS=erbbvmqfnteopgob
SMTP_FROM=leuchtturm.elternbeirat@gmail.com
```

### Supabase Configuration

```
PUBLIC_SUPABASE_URL=(keep your existing value)
PUBLIC_SUPABASE_ANON_KEY=(keep your existing value)
SUPABASE_SERVICE_ROLE_KEY=(keep your existing value)
```

## How to Update

1. Go to your Netlify dashboard
2. Select your project
3. Navigate to **Site configuration** → **Environment variables**
4. Add or update each variable listed above
5. Click **Save**
6. Trigger a new deployment for changes to take effect

## Important Notes

- The SMTP_USER email is `leuchtturm.elternbeirat@gmail.com` (with a dot, not hyphen)
- The SMTP_PASS is a Gmail App Password (16 characters, no spaces)
- After updating, redeploy your site for the changes to take effect

## Testing After Deployment

Once deployed, you can test the configuration by:

1. Visiting `/api/health` to check if services are configured
2. Creating a test reservation to verify email sending works
