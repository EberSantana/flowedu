import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT id, name, email, role, approvalStatus, active, openId FROM users WHERE email = ?',
  ['eberss@gmail.com']
);

console.log('=== USUÁRIO eberss@gmail.com ===\n');

if (rows.length > 0) {
  const user = rows[0];
  console.log(JSON.stringify(user, null, 2));
  console.log('\n=== VERIFICAÇÃO ===');
  console.log(`✓ ID: ${user.id}`);
  console.log(`✓ Nome: ${user.name}`);
  console.log(`✓ Email: ${user.email}`);
  console.log(`${user.role === 'admin' ? '✅' : '❌'} Role: ${user.role}`);
  console.log(`✓ ApprovalStatus: ${user.approvalStatus}`);
  console.log(`✓ Active: ${user.active ? 'Sim' : 'Não'}`);
  console.log(`✓ OpenId: ${user.openId}`);
} else {
  console.log('❌ Usuário não encontrado!');
}

await connection.end();
