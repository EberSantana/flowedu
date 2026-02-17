const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    uri: 'mysql://3L6VQmCyn9cEeAf.root:Wwz5D3yH6WV1500C@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/flowedu',
    ssl: { rejectUnauthorized: true }
  });
  
  try {
    console.log('=== TURMAS (classes) para userId=2 ===');
    const [classes] = await conn.query('SELECT id, name, user_id, shift_id FROM classes WHERE user_id = 2');
    console.log(JSON.stringify(classes, null, 2));
    
    console.log('\n=== DISCIPLINAS (subjects) para userId=2 ===');
    const [subjects] = await conn.query('SELECT id, name, user_id FROM subjects WHERE user_id = 2');
    console.log(JSON.stringify(subjects, null, 2));
    
    console.log('\n=== SCHEDULED_CLASSES para userId=2 ===');
    const [scheduled] = await conn.query('SELECT * FROM scheduled_classes WHERE user_id = 2 LIMIT 10');
    console.log(JSON.stringify(scheduled, null, 2));
    
    console.log('\n=== SHIFTS para userId=2 ===');
    const [shifts] = await conn.query('SELECT id, name, user_id FROM shifts WHERE user_id = 2');
    console.log(JSON.stringify(shifts, null, 2));
    
    console.log('\n=== TIME_SLOTS para shifts do userId=2 ===');
    const [timeSlots] = await conn.query(`
      SELECT ts.id, ts.shift_id, ts.slot_number, ts.start_time, ts.end_time, ts.label 
      FROM time_slots ts 
      JOIN shifts s ON ts.shift_id = s.id 
      WHERE s.user_id = 2
      ORDER BY ts.shift_id, ts.slot_number
    `);
    console.log(JSON.stringify(timeSlots, null, 2));
    
    console.log('\n=== COLUNAS DE scheduled_classes ===');
    const [cols] = await conn.query('SHOW COLUMNS FROM scheduled_classes');
    console.log(cols.map(c => `${c.Field} (${c.Type})`).join(', '));
    
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await conn.end();
  }
}
main();
