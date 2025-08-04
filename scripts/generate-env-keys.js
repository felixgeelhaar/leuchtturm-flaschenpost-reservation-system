#!/usr/bin/env node

/**
 * Generate secure keys for environment variables
 * Usage: node scripts/generate-env-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random key
function generateKey(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Generate all required keys
const keys = {
  JWT_SECRET: generateKey(32),
  SESSION_SECRET: generateKey(32),
  ENCRYPTION_KEY: generateKey(32),
  CSRF_SECRET: generateKey(32),
};

console.log('🔐 Generated Secure Keys for Production:\n');
console.log('Copy these to your Netlify environment variables:\n');

Object.entries(keys).forEach(([name, value]) => {
  console.log(`${name}=${value}`);
});

console.log('\n⚠️  IMPORTANT:');
console.log('- Save these keys securely');
console.log('- Use different keys for each environment');
console.log('- Never commit these to version control');
console.log('- Rotate keys regularly\n');

// Optionally create a local .env file
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Create a .env.production file with these keys? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    const envPath = path.join(process.cwd(), '.env.production');
    const envContent = `# Generated production keys - ${new Date().toISOString()}
# ⚠️ DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Security Keys
${Object.entries(keys).map(([name, value]) => `${name}=${value}`).join('\n')}

# Add your other environment variables below:
# PUBLIC_SUPABASE_URL=
# PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# SMTP_HOST=
# SMTP_PORT=
# SMTP_SECURE=
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=
# SITE_URL=
`;

    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Created ${envPath}`);
    console.log('📝 Remember to fill in the remaining variables');
    
    // Add to .gitignore if not already present
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.env.production')) {
        fs.appendFileSync(gitignorePath, '\n# Production environment\n.env.production\n');
        console.log('📝 Added .env.production to .gitignore');
      }
    }
  }
  
  rl.close();
});