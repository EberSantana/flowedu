import * as dbModule from '../server/db.ts';
import { studentExercises } from '../drizzle/schema.ts';

const exercises = await dbModule.getAllStudentExercises();

console.log('Total de exercícios publicados:', exercises.length);

if (exercises.length > 0) {
  console.log('\nPrimeiros 3 exercícios:');
  exercises.slice(0, 3).forEach(e => {
    console.log(`  - ID: ${e.id}`);
    console.log(`    Título: ${e.title}`);
    console.log(`    Disciplina ID: ${e.subjectId}`);
    console.log(`    Status: ${e.status}`);
    console.log(`    Questões: ${e.totalQuestions}`);
    console.log('');
  });
}

process.exit(0);
