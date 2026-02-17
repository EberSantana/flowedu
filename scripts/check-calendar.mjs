import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  "SELECT id, title, eventDate, eventType FROM calendar_events WHERE eventDate LIKE '2026%' ORDER BY eventDate ASC"
);

console.log("=== EVENTOS NO BANCO DE DADOS (2026) ===");
console.log(`Total: ${rows.length} eventos\n`);

for (const row of rows) {
  console.log(`[${row.id}] ${row.eventDate} | ${row.eventType} | ${row.title}`);
}

await connection.end();
