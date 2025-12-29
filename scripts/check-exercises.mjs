import { db } from '../server/db.js';
import { studentExercises, subjectEnrollments, subjects, students } from '../drizzle/schema.js';

console.log('=== VERIFICANDO EXERCÍCIOS PUBLICADOS ===');
const exercises = await db.select().from(studentExercises);
console.log('Total de exercícios publicados:', exercises.length);
if (exercises.length > 0) {
  exercises.forEach(ex => {
    console.log('- ID:', ex.id, '| Título:', ex.title, '| Disciplina ID:', ex.subjectId, '| Status:', ex.status);
  });
} else {
  console.log('⚠️  NENHUM EXERCÍCIO PUBLICADO NO BANCO!');
}

console.log('\n=== VERIFICANDO MATRÍCULAS DE ALUNOS ===');
const enrollments = await db.select().from(subjectEnrollments);
console.log('Total de matrículas:', enrollments.length);
if (enrollments.length > 0) {
  enrollments.forEach(enr => {
    console.log('- Aluno ID:', enr.studentId, '| Disciplina ID:', enr.subjectId, '| Status:', enr.status);
  });
} else {
  console.log('⚠️  NENHUMA MATRÍCULA ENCONTRADA!');
}

console.log('\n=== VERIFICANDO DISCIPLINAS ===');
const allSubjects = await db.select().from(subjects);
console.log('Total de disciplinas:', allSubjects.length);
if (allSubjects.length > 0) {
  allSubjects.slice(0, 5).forEach(sub => {
    console.log('- ID:', sub.id, '| Nome:', sub.name, '| Professor ID:', sub.userId);
  });
}

console.log('\n=== VERIFICANDO ALUNOS ===');
const allStudents = await db.select().from(students);
console.log('Total de alunos:', allStudents.length);
if (allStudents.length > 0) {
  allStudents.slice(0, 5).forEach(stu => {
    console.log('- ID:', stu.id, '| Matrícula:', stu.enrollment, '| Nome:', stu.fullName);
  });
} else {
  console.log('⚠️  NENHUM ALUNO CADASTRADO!');
}

process.exit(0);
