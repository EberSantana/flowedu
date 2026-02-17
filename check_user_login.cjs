const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    uri: 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== USER BY EMAIL ===');
  const [users] = await conn.execute("SELECT id, name, email, role, openId, loginMethod FROM users WHERE email = 'ebersantana@flowedu.app'");
  console.log(JSON.stringify(users, null, 2));

  if (users.length > 0) {
    const userId = users[0].id;
    console.log(`\nUserId: ${userId}`);
    
    console.log('\n=== SHIFTS FOR THIS USER ===');
    const [shifts] = await conn.execute("SELECT * FROM shifts WHERE userId = ?", [userId]);
    console.log(JSON.stringify(shifts, null, 2));
    
    console.log('\n=== TIME_SLOTS FOR THIS USER ===');
    const [slots] = await conn.execute("SELECT * FROM time_slots WHERE userId = ?", [userId]);
    console.log(JSON.stringify(slots, null, 2));
    
    console.log('\n=== SCHEDULED_CLASSES FOR THIS USER ===');
    const [classes] = await conn.execute("SELECT * FROM scheduled_classes WHERE userId = ? LIMIT 10", [userId]);
    console.log(JSON.stringify(classes, null, 2));
  }

  await conn.end();
}

main().catch(console.error);
