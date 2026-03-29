// test-db.js - Run from your project root: node test-db.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Manually read .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found in:', process.cwd());
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...rest] = line.split('=');
    process.env[key.trim()] = rest.join('=').trim();
  });
  console.log('📄 Loaded .env.local');
}

async function test() {
  loadEnv();

  const config = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'eduportal',
  };

  console.log('\n=== EduPortal DB Connection Test ===');
  console.log('Config:', { ...config, password: config.password ? '***' : '(empty)' });
  console.log('');

  try {
    const conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL successfully!');

    const [users] = await conn.execute('SELECT COUNT(*) as cnt FROM users');
    console.log(`✅ users table found — ${users[0].cnt} users`);

    const [admin] = await conn.execute("SELECT id, name, email, role FROM users WHERE email = 'admin@eduportal.com'");
    if (admin.length > 0) {
      console.log(`✅ Admin user found: ${admin[0].name}`);
      console.log('\n🎉 Everything is set up correctly! Login should work.');
    } else {
      console.log('❌ Admin user not found. Re-import eduportal.sql');
    }

    await conn.end();
  } catch (e) {
    console.log('❌ Error:', e.code, '-', e.message);
  }

  console.log('\n====================================\n');
}

test();