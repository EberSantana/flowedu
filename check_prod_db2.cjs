const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    uri: 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu',
    ssl: { rejectUnauthorized: true }
  });

  console.log('=== TABLES ===');
  const [tables] = await conn.execute("SHOW TABLES LIKE '%user%'");
  console.log(JSON.stringify(tables, null, 2));

  console.log('\n=== ALL TABLES ===');
  const [allTables] = await conn.execute("SHOW TABLES");
  const tableNames = allTables.map(t => Object.values(t)[0]);
  console.log(tableNames.join(', '));

  // Find user table
  const userTable = tableNames.find(t => t.toLowerCase().includes('user'));
  if (userTable) {
    console.log(`\n=== ${userTable} ===`);
    const [users] = await conn.execute(`SELECT id, name, role FROM \`${userTable}\` LIMIT 10`);
    console.log(JSON.stringify(users, null, 2));
  }

  await conn.end();
}

main().catch(console.error);
