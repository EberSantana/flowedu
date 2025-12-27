import { drizzle } from 'drizzle-orm/mysql2';
import { subjectEnrollments } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

try {
  const result = await db.insert(subjectEnrollments).values({
    studentId: 999999,
    subjectId: 999999,
    userId: 1,
  });
  console.log('Insert successful:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Insert failed:', error.message);
  console.error('SQL:', error.sql);
}

process.exit(0);
