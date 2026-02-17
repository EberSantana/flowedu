const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    uri: 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== SHIFTS ===');
  const [shifts] = await conn.execute('SELECT * FROM shifts');
  console.log(JSON.stringify(shifts, null, 2));

  console.log('\n=== TIME_SLOTS (first 20) ===');
  const [timeSlots] = await conn.execute('SELECT * FROM time_slots LIMIT 20');
  console.log(JSON.stringify(timeSlots, null, 2));

  console.log('\n=== USERS ===');
  const [users] = await conn.execute('SELECT id, name, role FROM user LIMIT 10');
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== SCHEDULED_CLASSES (first 10) ===');
  const [classes] = await conn.execute('SELECT * FROM scheduled_classes LIMIT 10');
  console.log(JSON.stringify(classes, null, 2));

  await conn.end();
}

main().catch(console.error);
