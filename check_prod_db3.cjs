const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    uri: 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== USERS COLUMNS ===');
  const [cols] = await conn.execute("SHOW COLUMNS FROM users");
  console.log(cols.map(c => c.Field).join(', '));

  console.log('\n=== USERS WITH OPENID ===');
  const [users] = await conn.execute("SELECT id, name, role, openId FROM users LIMIT 10");
  console.log(JSON.stringify(users, null, 2));

  await conn.end();
}

main().catch(console.error);
