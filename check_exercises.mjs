import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL?.replace('file:', '') || './local.db');

console.log('=== EXERCÍCIOS ===');
const exercises = db.prepare('SELECT * FROM exercises LIMIT 5').all();
console.log(JSON.stringify(exercises, null, 2));

console.log('\n=== TENTATIVAS ===');
const attempts = db.prepare('SELECT * FROM student_exercise_attempts LIMIT 5').all();
console.log(JSON.stringify(attempts, null, 2));

console.log('\n=== RESPOSTAS ===');
const answers = db.prepare('SELECT * FROM student_exercise_answers LIMIT 5').all();
console.log(JSON.stringify(answers, null, 2));

db.close();
