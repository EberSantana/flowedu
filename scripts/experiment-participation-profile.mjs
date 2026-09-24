import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const OUTPUT_PATH = path.resolve("analysis/experiment_participation_profile.json");
const START = "2026-01-05T00:00:00.000Z";
const END = "2026-03-16T00:00:00.000Z";

const n = (value) => value === null || value === undefined ? null : Number(value);
const rowsToObject = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
  if (typeof value === "number") return [key, value];
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) return [key, Number(value)];
  return [key, value];
}));

const connection = await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true });
try {
  const [periodRows] = await connection.query("SELECT DATABASE() AS databaseName");
  const databaseName = periodRows[0].databaseName;
  const p = [START, END];

  const [[base]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM students) AS registeredStudents,
      (SELECT COUNT(*) FROM users) AS registeredTeachers,
      (SELECT COUNT(*) FROM users WHERE active = 1 AND approvalStatus = 'approved') AS activeApprovedAccounts,
      (SELECT COUNT(*) FROM subjects) AS registeredSubjects,
      (SELECT COUNT(DISTINCT studentId) FROM student_enrollments WHERE createdAt >= ? AND createdAt < ?) AS enrolledStudents,
      (SELECT COUNT(DISTINCT studentId) FROM subjectEnrollments WHERE enrolledAt >= ? AND enrolledAt < ?) AS subjectEnrolledStudents,
      (SELECT COUNT(DISTINCT studentId) FROM student_class_enrollments WHERE enrolledAt >= ? AND enrolledAt < ?) AS classEnrolledStudents,
      (SELECT COUNT(*) FROM student_exercise_attempts WHERE createdAt >= ? AND createdAt < ?) AS exerciseAttempts,
      (SELECT COUNT(DISTINCT studentId) FROM student_exercise_attempts WHERE createdAt >= ? AND createdAt < ?) AS studentsAttemptingExercises,
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ?) AS exerciseAnswers,
      (SELECT COUNT(DISTINCT a.studentId) FROM student_exercise_answers ans JOIN student_exercise_attempts a ON a.id = ans.attemptId WHERE ans.createdAt >= ? AND ans.createdAt < ?) AS studentsAnsweringExercises,
      (SELECT COUNT(*) FROM assignment_submissions WHERE submittedAt >= ? AND submittedAt < ?) AS assignmentSubmissions,
      (SELECT COUNT(DISTINCT studentId) FROM assignment_submissions WHERE submittedAt >= ? AND submittedAt < ?) AS studentsSubmittingAssignments,
      (SELECT COUNT(*) FROM topic_progress_history WHERE completedAt >= ? AND completedAt < ?) AS completedTopicEvents,
      (SELECT COUNT(DISTINCT studentId) FROM topic_progress_history WHERE completedAt >= ? AND completedAt < ?) AS studentsCompletingTopics,
      (SELECT COUNT(*) FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ?) AS behaviorEvents,
      (SELECT COUNT(DISTINCT studentId) FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ?) AS studentsWithBehaviorEvents,
      (SELECT COUNT(*) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?) AS aiInsights,
      (SELECT COUNT(DISTINCT studentId) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?) AS studentsWithAiInsights
  `, Array.from({ length: 15 }, () => p).flat());

  const [[genderAll]] = await connection.query(`SELECT
    COUNT(*) AS students,
    SUM(gender = 'masculino') AS masculino,
    SUM(gender = 'feminino') AS feminino,
    SUM(gender = 'nao_binario') AS naoBinario,
    SUM(gender = 'personalizar') AS personalizar,
    SUM(gender = 'prefiro_nao_informar') AS prefiroNaoInformar,
    SUM(gender IS NULL) AS semGenero,
    SUM(avatarGender = 'male') AS avatarMale,
    SUM(avatarGender = 'female') AS avatarFemale,
    SUM(avatarGender IS NULL) AS semAvatarGender
    FROM students`);

  const [[integrity]] = await connection.query(`
    SELECT
      COUNT(DISTINCT a.studentId) AS answerStudentIds,
      COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN a.studentId END) AS answerStudentsFoundInStudents,
      COUNT(DISTINCT CASE WHEN s.id IS NULL THEN a.studentId END) AS answerStudentIdsMissingInStudents
      FROM student_exercise_answers ans
      JOIN student_exercise_attempts a ON a.id = ans.attemptId
      LEFT JOIN students s ON s.id = a.studentId
     WHERE ans.createdAt >= ? AND ans.createdAt < ?`, p);

  const [genderParticipants] = await connection.query(`
    WITH participants AS (
      SELECT DISTINCT studentId FROM student_exercise_attempts WHERE createdAt >= ? AND createdAt < ?
      UNION SELECT DISTINCT a.studentId FROM student_exercise_answers ans JOIN student_exercise_attempts a ON a.id = ans.attemptId WHERE ans.createdAt >= ? AND ans.createdAt < ?
      UNION SELECT DISTINCT studentId FROM assignment_submissions WHERE submittedAt >= ? AND submittedAt < ?
      UNION SELECT DISTINCT studentId FROM topic_progress_history WHERE completedAt >= ? AND completedAt < ?
      UNION SELECT DISTINCT studentId FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ?
      UNION SELECT DISTINCT studentId FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?
    )
    SELECT COALESCE(s.gender, '(não informado)') AS gender, COUNT(*) AS students
      FROM participants p JOIN students s ON s.id = p.studentId
     GROUP BY COALESCE(s.gender, '(não informado)') ORDER BY students DESC, gender`, Array.from({ length: 6 }, () => p).flat());

  const [[late]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM assignment_submissions s JOIN topic_assignments a ON a.id = s.assignmentId WHERE s.submittedAt >= ? AND s.submittedAt < ? AND a.dueDate IS NOT NULL AND s.submittedAt > a.dueDate) AS lateAssignmentSubmissions,
      (SELECT COUNT(DISTINCT s.studentId) FROM assignment_submissions s JOIN topic_assignments a ON a.id = s.assignmentId WHERE s.submittedAt >= ? AND s.submittedAt < ? AND a.dueDate IS NOT NULL AND s.submittedAt > a.dueDate) AS studentsWithLateAssignment,
      (SELECT COUNT(*) FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ? AND behaviorType = 'late_submission') AS lateBehaviorEvents,
      (SELECT COUNT(DISTINCT studentId) FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ? AND behaviorType = 'late_submission') AS studentsWithLateBehavior,
      (SELECT COUNT(*) FROM student_exercise_attempts e JOIN student_exercises x ON x.id = e.exerciseId WHERE e.createdAt >= ? AND e.createdAt < ? AND x.availableTo IS NOT NULL AND COALESCE(e.completedAt, e.updatedAt) > x.availableTo) AS lateExerciseAttempts,
      (SELECT COUNT(DISTINCT e.studentId) FROM student_exercise_attempts e JOIN student_exercises x ON x.id = e.exerciseId WHERE e.createdAt >= ? AND e.createdAt < ? AND x.availableTo IS NOT NULL AND COALESCE(e.completedAt, e.updatedAt) > x.availableTo) AS studentsWithLateExercise
  `, Array.from({ length: 6 }, () => p).flat());

  const [submissionsByStatus] = await connection.query(`SELECT status, COUNT(*) AS rowCount, COUNT(DISTINCT studentId) AS students FROM assignment_submissions WHERE submittedAt >= ? AND submittedAt < ? GROUP BY status ORDER BY rowCount DESC`, p);
  const [attemptsByStatus] = await connection.query(`SELECT status, COUNT(*) AS rowCount, COUNT(DISTINCT studentId) AS students FROM student_exercise_attempts WHERE createdAt >= ? AND createdAt < ? GROUP BY status ORDER BY rowCount DESC`, p);
  const [behaviorTypes] = await connection.query(`SELECT behaviorType, COUNT(*) AS rowCount, COUNT(DISTINCT studentId) AS students FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ? GROUP BY behaviorType ORDER BY rowCount DESC`, p);

  const [[teacherSupport]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM topic_materials WHERE createdAt >= ? AND createdAt < ?) AS materialsCreated,
      (SELECT COUNT(DISTINCT professorId) FROM topic_materials WHERE createdAt >= ? AND createdAt < ?) AS teachersCreatingMaterials,
      (SELECT COUNT(*) FROM student_exercises WHERE createdAt >= ? AND createdAt < ?) AS exercisesCreated,
      (SELECT COUNT(DISTINCT teacherId) FROM student_exercises WHERE createdAt >= ? AND createdAt < ?) AS teachersCreatingExercises,
      (SELECT COUNT(*) FROM topic_assignments WHERE createdAt >= ? AND createdAt < ?) AS assignmentsCreated,
      (SELECT COUNT(DISTINCT professorId) FROM topic_assignments WHERE createdAt >= ? AND createdAt < ?) AS teachersCreatingAssignments,
      (SELECT COUNT(*) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?) AS aiInsightsGenerated,
      (SELECT COUNT(DISTINCT userId) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?) AS teachersGeneratingInsights,
      (SELECT COUNT(*) FROM teacher_activities_history WHERE createdAt >= ? AND createdAt < ?) AS teacherActivityRecords,
      (SELECT COUNT(DISTINCT userId) FROM teacher_activities_history WHERE createdAt >= ? AND createdAt < ?) AS teachersWithActivityRecords,
      (SELECT COUNT(*) FROM topic_comments WHERE createdAt >= ? AND createdAt < ? AND authorType = 'professor') AS professorComments,
      (SELECT COUNT(DISTINCT professorId) FROM topic_comments WHERE createdAt >= ? AND createdAt < ? AND authorType = 'professor') AS teachersCommenting,
      (SELECT COUNT(*) FROM student_topic_doubts WHERE createdAt >= ? AND createdAt < ?) AS studentDoubts,
      (SELECT COUNT(DISTINCT professorId) FROM student_topic_doubts WHERE createdAt >= ? AND createdAt < ?) AS teachersReceivingDoubts,
      (SELECT COUNT(*) FROM ai_usage_logs WHERE createdAt >= ? AND createdAt < ?) AS loggedAiCalls
  `, Array.from({ length: 15 }, () => p).flat());

  const [[fieldSupport]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND aiFeedback IS NOT NULL) AS answersWithAiFeedback,
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND studyTips IS NOT NULL) AS answersWithStudyTips,
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND aiAnalysis IS NOT NULL) AS answersWithAiAnalysis,
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND teacherFeedback IS NOT NULL) AS answersWithTeacherFeedback,
      (SELECT COUNT(*) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND reviewedAt IS NOT NULL) AS answersReviewedByTeacher,
      (SELECT COUNT(DISTINCT reviewedBy) FROM student_exercise_answers WHERE createdAt >= ? AND createdAt < ? AND reviewedBy IS NOT NULL) AS reviewingTeachers
  `, Array.from({ length: 6 }, () => p).flat());

  const output = {
    metadata: { generatedAtUtc: new Date().toISOString(), databaseName, startUtc: START, endExclusiveUtc: END, method: "read-only aggregate queries; no names, emails, registration numbers, prompts, answers or IP addresses exported" },
    base: rowsToObject(base),
    genderAll: rowsToObject(genderAll),
    integrity: rowsToObject(integrity),
    genderParticipants: genderParticipants.map(rowsToObject),
    late: rowsToObject(late),
    submissionsByStatus: submissionsByStatus.map(rowsToObject),
    attemptsByStatus: attemptsByStatus.map(rowsToObject),
    behaviorTypes: behaviorTypes.map(rowsToObject),
    teacherSupport: rowsToObject(teacherSupport),
    fieldSupport: rowsToObject(fieldSupport),
    limitations: [
      "The database has gender fields, but gender is sensitive personal data; any publication must use aggregate counts, suppress small cells where appropriate, and confirm the lawful basis and research ethics requirements.",
      "The database does not contain an explicit experiment identifier, control group, consent flag, or reliable exposure/visualization event for every AI artifact.",
      "Late assignment counts use submittedAt > topic_assignments.dueDate; late exercise counts use completedAt/updatedAt > student_exercises.availableTo. These are operational proxies, not a validated institutional lateness rule.",
      "AI support fields in exercise answers are evidence of stored fields, not proof that a provider call generated them, because ai_usage_logs is empty.",
      "Participation is reported by multiple operational definitions because no single experiment-participant table exists."
    ]
  };
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(JSON.stringify({ outputPath: OUTPUT_PATH, base: output.base, genderParticipants: output.genderParticipants, late: output.late, teacherSupport: output.teacherSupport }, null, 2));
} finally {
  await connection.end();
}
