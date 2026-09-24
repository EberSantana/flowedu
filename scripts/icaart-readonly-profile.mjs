import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const OUTPUT_PATH = path.resolve("analysis/icaart_2027_aggregate_metrics.json");
const DAYS = 70;
const STUDY_START_UTC = "2026-01-05T00:00:00.000Z";
const STUDY_END_EXCLUSIVE_UTC = "2026-03-16T00:00:00.000Z";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

function asNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function summarize(values) {
  const numeric = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (numeric.length === 0) {
    return { n: 0, mean: null, median: null, stdDevSample: null, min: null, q1: null, q3: null, max: null };
  }
  const quantile = (p) => {
    const position = (numeric.length - 1) * p;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return numeric[lower] + (numeric[upper] - numeric[lower]) * (position - lower);
  };
  const mean = numeric.reduce((total, value) => total + value, 0) / numeric.length;
  const variance = numeric.length > 1
    ? numeric.reduce((total, value) => total + (value - mean) ** 2, 0) / (numeric.length - 1)
    : null;
  return {
    n: numeric.length,
    mean,
    median: quantile(0.5),
    stdDevSample: variance === null ? null : Math.sqrt(variance),
    min: numeric[0],
    q1: quantile(0.25),
    q3: quantile(0.75),
    max: numeric[numeric.length - 1],
  };
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[period]] = await connection.query(
    `SELECT DATABASE() AS databaseName`
  );
  period.analysisStart = new Date(STUDY_START_UTC);
  period.analysisEnd = new Date(STUDY_END_EXCLUSIVE_UTC);
  const since = period.analysisStart;
  const until = period.analysisEnd;

  const [baseCounts] = await connection.query(
    `SELECT
       (SELECT COUNT(*) FROM users) AS teachersRegistered,
       (SELECT COUNT(*) FROM users WHERE active = 1 AND approvalStatus = 'approved') AS teachersActiveApproved,
       (SELECT COUNT(*) FROM students) AS studentsRegistered,
       (SELECT COUNT(*) FROM subjects) AS subjectsRegistered,
       (SELECT COUNT(*) FROM ai_usage_logs WHERE createdAt >= ? AND createdAt < ?) AS aiCalls70d,
       (SELECT COUNT(*) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ?) AS aiInsights70d,
       (SELECT COUNT(*) FROM ai_analysis_cache WHERE createdAt >= ? AND createdAt < ?) AS aiCacheEntries70d,
       (SELECT COUNT(*) FROM learning_modules WHERE createdAt >= ? AND createdAt < ?) AS modulesCreated70d,
       (SELECT COUNT(*) FROM learning_topics WHERE createdAt >= ? AND createdAt < ?) AS topicsCreated70d,
       (SELECT COUNT(*) FROM assessments WHERE createdAt >= ? AND createdAt < ?) AS assessmentsCreated70d,
       (SELECT COUNT(*) FROM assessment_attempts WHERE createdAt >= ? AND createdAt < ?) AS assessmentAttempts70d,
       (SELECT COUNT(*) FROM student_topic_progress WHERE createdAt >= ? AND createdAt < ?) AS topicProgressEvents70d,
       (SELECT COUNT(*) FROM student_behaviors WHERE recordedAt >= ? AND recordedAt < ?) AS behaviors70d,
       (SELECT COUNT(*) FROM access_logs WHERE accessedAt >= ? AND accessedAt < ?) AS accessLogs70d`,
    Array.from({ length: 10 }, () => [since, until]).flat()
  );

  const [allTimeCoverage] = await connection.query(
    `SELECT 'ai_usage_logs' AS sourceTable, COUNT(*) AS rowCount, MIN(createdAt) AS firstEventAt, MAX(createdAt) AS lastEventAt FROM ai_usage_logs
     UNION ALL SELECT 'ai_insights', COUNT(*), MIN(generatedAt), MAX(generatedAt) FROM ai_insights
     UNION ALL SELECT 'ai_analysis_cache', COUNT(*), MIN(createdAt), MAX(createdAt) FROM ai_analysis_cache
     UNION ALL SELECT 'learning_modules', COUNT(*), MIN(createdAt), MAX(createdAt) FROM learning_modules
     UNION ALL SELECT 'learning_topics', COUNT(*), MIN(createdAt), MAX(createdAt) FROM learning_topics
     UNION ALL SELECT 'assessments', COUNT(*), MIN(createdAt), MAX(createdAt) FROM assessments
     UNION ALL SELECT 'assessment_attempts', COUNT(*), MIN(createdAt), MAX(createdAt) FROM assessment_attempts
     UNION ALL SELECT 'assessment_answers', COUNT(*), MIN(createdAt), MAX(createdAt) FROM assessment_answers
     UNION ALL SELECT 'student_topic_progress', COUNT(*), MIN(createdAt), MAX(createdAt) FROM student_topic_progress
     UNION ALL SELECT 'student_behaviors', COUNT(*), MIN(recordedAt), MAX(recordedAt) FROM student_behaviors
     UNION ALL SELECT 'learning_recommendations', COUNT(*), MIN(createdAt), MAX(createdAt) FROM learning_recommendations
     UNION ALL SELECT 'practice_question_hints', COUNT(*), MIN(generatedAt), MAX(generatedAt) FROM practice_question_hints
     UNION ALL SELECT 'student_exercise_answers', COUNT(*), MIN(createdAt), MAX(createdAt) FROM student_exercise_answers
     UNION ALL SELECT 'access_logs', COUNT(*), MIN(accessedAt), MAX(accessedAt) FROM access_logs`
  );

  const [aiTotalsRows] = await connection.query(
    `SELECT
       COUNT(*) AS calls,
       COALESCE(SUM(success = 1), 0) AS successes,
       COALESCE(SUM(success = 0), 0) AS failures,
       COUNT(DISTINCT user_id) AS uniqueTeachers,
       COALESCE(SUM(total_tokens), 0) AS totalTokens,
       AVG(total_tokens) AS avgTokensPerCall,
       AVG(prompt_tokens) AS avgPromptTokens,
       AVG(completion_tokens) AS avgCompletionTokens,
       MIN(createdAt) AS firstCallAt,
       MAX(createdAt) AS lastCallAt
     FROM ai_usage_logs
     WHERE createdAt >= ? AND createdAt < ?`,
    [since, until]
  );

  const [aiByFeature] = await connection.query(
    `SELECT COALESCE(NULLIF(feature, ''), '(not recorded)') AS feature,
            COUNT(*) AS calls,
            SUM(success = 1) AS successes,
            SUM(success = 0) AS failures,
            COUNT(DISTINCT user_id) AS uniqueTeachers,
            SUM(total_tokens) AS totalTokens
       FROM ai_usage_logs
      WHERE createdAt >= ? AND createdAt < ?
      GROUP BY COALESCE(NULLIF(feature, ''), '(not recorded)')
      ORDER BY calls DESC, feature ASC`,
    [since, until]
  );

  const [aiByModel] = await connection.query(
    `SELECT COALESCE(NULLIF(provider, ''), '(not recorded)') AS provider,
            COALESCE(NULLIF(model, ''), '(not recorded)') AS model,
            COUNT(*) AS calls,
            SUM(success = 1) AS successes,
            SUM(success = 0) AS failures,
            SUM(total_tokens) AS totalTokens
       FROM ai_usage_logs
      WHERE createdAt >= ? AND createdAt < ?
      GROUP BY COALESCE(NULLIF(provider, ''), '(not recorded)'), COALESCE(NULLIF(model, ''), '(not recorded)')
      ORDER BY calls DESC, provider ASC, model ASC`,
    [since, until]
  );

  const [aiByDay] = await connection.query(
    `SELECT DATE(createdAt) AS date,
            COUNT(*) AS calls,
            SUM(success = 1) AS successes,
            SUM(success = 0) AS failures
       FROM ai_usage_logs
      WHERE createdAt >= ? AND createdAt < ?
      GROUP BY DATE(createdAt)
      ORDER BY date ASC`,
    [since, until]
  );

  const [cacheByType] = await connection.query(
    `SELECT analysisType,
            COUNT(*) AS entries,
            COUNT(DISTINCT userId) AS uniqueTeachers,
            SUM(hitCount) AS totalCacheHits,
            SUM(OCTET_LENGTH(inputData)) AS inputBytes,
            SUM(OCTET_LENGTH(resultData)) AS outputBytes,
            MIN(createdAt) AS firstCreatedAt,
            MAX(createdAt) AS lastCreatedAt
       FROM ai_analysis_cache
      WHERE createdAt >= ? AND createdAt < ?
      GROUP BY analysisType
      ORDER BY entries DESC, analysisType ASC`,
    [since, until]
  );

  const [insightsByType] = await connection.query(
    `SELECT COALESCE(NULLIF(insightType, ''), '(not recorded)') AS insightType,
            COUNT(*) AS insights,
            COUNT(DISTINCT studentId) AS uniqueStudents,
            COUNT(DISTINCT userId) AS uniqueTeachers,
            SUM(actionable = 1) AS actionableInsights,
            SUM(dismissed = 1) AS dismissedInsights
       FROM ai_insights
      WHERE generatedAt >= ? AND generatedAt < ?
      GROUP BY COALESCE(NULLIF(insightType, ''), '(not recorded)')
      ORDER BY insights DESC, insightType ASC`,
    [since, until]
  );

  const [directStudentSupport] = await connection.query(
    `SELECT
       (SELECT COUNT(DISTINCT studentId) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ? AND studentId IS NOT NULL) AS studentsWithAiInsights,
       (SELECT COUNT(DISTINCT studentId) FROM learning_recommendations WHERE createdAt >= ? AND createdAt < ?) AS studentsWithRecommendations,
       (SELECT COUNT(DISTINCT attempt.studentId)
          FROM practice_question_hints hint
          JOIN practice_question_attempts attempt ON attempt.id = hint.attemptId
         WHERE hint.generatedAt >= ? AND hint.generatedAt < ?) AS studentsWithPracticeHints,
       (SELECT COUNT(DISTINCT attempt.studentId)
          FROM student_exercise_answers answer
          JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
         WHERE answer.createdAt >= ? AND answer.createdAt < ?
           AND (answer.aiFeedback IS NOT NULL OR answer.studyTips IS NOT NULL OR answer.aiAnalysis IS NOT NULL OR answer.detailedExplanation IS NOT NULL)) AS studentsWithAiExerciseFeedback`,
    [since, until, since, until, since, until, since, until]
  );

  const [hintStats] = await connection.query(
    `SELECT hintType,
            COUNT(*) AS hints,
            AVG(confidence) AS avgConfidence,
            MIN(generatedAt) AS firstGeneratedAt,
            MAX(generatedAt) AS lastGeneratedAt
       FROM practice_question_hints
      WHERE generatedAt >= ? AND generatedAt < ?
      GROUP BY hintType
      ORDER BY hints DESC, hintType ASC`,
    [since, until]
  );

  const [exerciseAiFeedback] = await connection.query(
    `SELECT
       COUNT(*) AS answerRows,
       SUM(aiFeedback IS NOT NULL) AS withAiFeedback,
       SUM(studyTips IS NOT NULL) AS withStudyTips,
       SUM(aiAnalysis IS NOT NULL) AS withAiAnalysis,
       SUM(detailedExplanation IS NOT NULL) AS withDetailedExplanation,
       SUM(needsReview = 1) AS flaggedForReview,
       SUM(reviewedAt IS NOT NULL) AS reviewedAtRecorded
     FROM student_exercise_answers answer
     WHERE createdAt >= ? AND createdAt < ?`,
    [since, until]
  );

  const [aiArtifactCoverage] = await connection.query(
    `SELECT
       (SELECT COUNT(DISTINCT subjectId) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ? AND subjectId IS NOT NULL) AS subjectsWithAiInsights,
       (SELECT COUNT(DISTINCT userId) FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ? AND userId IS NOT NULL) AS teachersWithAiInsights,
       (SELECT COUNT(DISTINCT exercise.subjectId)
          FROM student_exercise_answers answer
          JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
          JOIN student_exercises exercise ON exercise.id = attempt.exerciseId
         WHERE answer.createdAt >= ? AND answer.createdAt < ?
           AND (answer.aiFeedback IS NOT NULL OR answer.studyTips IS NOT NULL OR answer.aiAnalysis IS NOT NULL OR answer.detailedExplanation IS NOT NULL)) AS subjectsWithAiExerciseFeedback,
       (SELECT COUNT(DISTINCT exercise.teacherId)
          FROM student_exercise_answers answer
          JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
          JOIN student_exercises exercise ON exercise.id = attempt.exerciseId
         WHERE answer.createdAt >= ? AND answer.createdAt < ?
           AND (answer.aiFeedback IS NOT NULL OR answer.studyTips IS NOT NULL OR answer.aiAnalysis IS NOT NULL OR answer.detailedExplanation IS NOT NULL)) AS teachersWithAiExerciseFeedback,
       (SELECT COUNT(DISTINCT attempt.studentId)
          FROM student_exercise_answers answer
          JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
         WHERE answer.createdAt >= ? AND answer.createdAt < ? AND answer.studyTips IS NOT NULL) AS studentsWithStudyTips,
       (SELECT COUNT(*)
          FROM (
            SELECT studentId FROM ai_insights WHERE generatedAt >= ? AND generatedAt < ? AND studentId IS NOT NULL
            UNION
            SELECT attempt.studentId
              FROM student_exercise_answers answer
              JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
             WHERE answer.createdAt >= ? AND answer.createdAt < ?
               AND (answer.aiFeedback IS NOT NULL OR answer.studyTips IS NOT NULL OR answer.aiAnalysis IS NOT NULL OR answer.detailedExplanation IS NOT NULL)
          ) impactedStudents) AS studentsWithAnyDocumentedAiArtifact,
       (SELECT COUNT(DISTINCT insight.studentId)
          FROM ai_insights insight
          JOIN student_topic_progress progress ON progress.studentId = insight.studentId
         WHERE insight.generatedAt >= ? AND insight.generatedAt < ?
           AND progress.status = 'completed'
           AND progress.completedAt IS NOT NULL
           AND progress.completedAt > insight.generatedAt) AS studentsWithCompletedTopicAfterAiInsight,
       (SELECT COALESCE(SUM(
            OCTET_LENGTH(COALESCE(aiFeedback, '')) +
            OCTET_LENGTH(COALESCE(studyTips, '')) +
            OCTET_LENGTH(COALESCE(aiAnalysis, '')) +
            OCTET_LENGTH(COALESCE(detailedExplanation, '')) +
            OCTET_LENGTH(COALESCE(studyStrategy, '')) +
            OCTET_LENGTH(COALESCE(relatedConcepts, '')) +
            OCTET_LENGTH(COALESCE(additionalResources, '')) +
            OCTET_LENGTH(COALESCE(practiceExamples, '')) +
            OCTET_LENGTH(COALESCE(commonMistakes, ''))
          ), 0)
          FROM student_exercise_answers
         WHERE createdAt >= ? AND createdAt < ?) AS aiExerciseFieldBytes,
       (SELECT COALESCE(SUM(
            OCTET_LENGTH(COALESCE(description, '')) +
            OCTET_LENGTH(COALESCE(actionSuggestion, ''))
          ), 0)
          FROM ai_insights
         WHERE generatedAt >= ? AND generatedAt < ?) AS aiInsightFieldBytes`,
    [
      since, until, since, until,
      since, until, since, until,
      since, until,
      since, until, since, until,
      since, until,
      since, until,
      since, until,
      since, until,
    ]
  );

  const [studyTipDistribution] = await connection.query(
    `WITH tip_events AS (
       SELECT attempt.studentId, exercise.topicId
         FROM student_exercise_answers answer
         JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
         JOIN student_exercises exercise ON exercise.id = attempt.exerciseId
        WHERE answer.createdAt >= ? AND answer.createdAt < ?
          AND answer.studyTips IS NOT NULL
     ),
     tips_per_student AS (
       SELECT studentId, COUNT(*) AS tipCount FROM tip_events GROUP BY studentId
     ),
     tips_per_topic AS (
       SELECT topicId, COUNT(*) AS tipCount FROM tip_events WHERE topicId IS NOT NULL GROUP BY topicId
     )
     SELECT
       (SELECT COUNT(*) FROM tip_events) AS tipAnswerRows,
       (SELECT COUNT(*) FROM tips_per_student) AS students,
       (SELECT COUNT(*) FROM tips_per_topic) AS topics,
       (SELECT MIN(tipCount) FROM tips_per_student) AS minTipsPerStudent,
       (SELECT MAX(tipCount) FROM tips_per_student) AS maxTipsPerStudent,
       (SELECT AVG(tipCount) FROM tips_per_student) AS avgTipsPerStudent,
       (SELECT MIN(tipCount) FROM tips_per_topic) AS minTipsPerTopic,
       (SELECT MAX(tipCount) FROM tips_per_topic) AS maxTipsPerTopic,
       (SELECT AVG(tipCount) FROM tips_per_topic) AS avgTipsPerTopic`,
    [since, until]
  );

  const [progressByTipCohort] = await connection.query(
    `WITH tip_students AS (
       SELECT DISTINCT attempt.studentId
         FROM student_exercise_answers answer
         JOIN student_exercise_attempts attempt ON attempt.id = answer.attemptId
        WHERE answer.createdAt >= ? AND answer.createdAt < ?
          AND answer.studyTips IS NOT NULL
     ),
     progress AS (
       SELECT studentId,
              SUM(status = 'completed') AS completedTopics,
              COUNT(*) AS trackedTopics
         FROM student_topic_progress
        WHERE updatedAt >= ? AND updatedAt < ?
        GROUP BY studentId
     )
     SELECT CASE WHEN tip_students.studentId IS NULL THEN 'without_study_tips' ELSE 'with_study_tips' END AS cohort,
            COUNT(*) AS studentsWithTrackedProgress,
            SUM(progress.completedTopics) AS completedTopics,
            SUM(progress.trackedTopics) AS trackedTopics,
            AVG(progress.completedTopics / NULLIF(progress.trackedTopics, 0)) AS meanCompletionRate
       FROM progress
       LEFT JOIN tip_students ON tip_students.studentId = progress.studentId
      GROUP BY CASE WHEN tip_students.studentId IS NULL THEN 'without_study_tips' ELSE 'with_study_tips' END
      ORDER BY cohort ASC`,
    [since, until, since, until]
  );

  const [assessmentScores] = await connection.query(
    `SELECT percentage
     FROM assessment_attempts
      WHERE createdAt >= ? AND createdAt < ?
        AND percentage IS NOT NULL`,
    [since, until]
  );

  const [assessmentQuestionAccuracy] = await connection.query(
    `SELECT COUNT(*) AS answerRows,
            SUM(isCorrect = 1) AS correctAnswers,
            COUNT(DISTINCT questionId) AS distinctQuestions,
            COUNT(DISTINCT attemptId) AS distinctAttempts
       FROM assessment_answers
      WHERE createdAt >= ? AND createdAt < ?`,
    [since, until]
  );

  const [assessmentLifecycle] = await connection.query(
    `SELECT status, COUNT(*) AS assessments, MIN(createdAt) AS firstCreatedAt, MAX(createdAt) AS lastCreatedAt
       FROM assessments
      WHERE createdAt >= ? AND createdAt < ?
      GROUP BY status
      ORDER BY assessments DESC, status ASC`,
    [since, until]
  );

  const [behaviorByType] = await connection.query(
    `SELECT behaviorType, COUNT(*) AS records, COUNT(DISTINCT studentId) AS uniqueStudents
       FROM student_behaviors
      WHERE recordedAt >= ? AND recordedAt < ?
      GROUP BY behaviorType
      ORDER BY records DESC, behaviorType ASC`,
    [since, until]
  );

  const [behaviorByDay] = await connection.query(
    `SELECT DATE(recordedAt) AS date, COUNT(*) AS records
       FROM student_behaviors
      WHERE recordedAt >= ? AND recordedAt < ?
      GROUP BY DATE(recordedAt)
      ORDER BY date ASC`,
    [since, until]
  );

  const [progressSummaryRows] = await connection.query(
    `SELECT status, COUNT(*) AS rowCount, COUNT(DISTINCT studentId) AS uniqueStudents
       FROM student_topic_progress
      WHERE updatedAt >= ? AND updatedAt < ?
      GROUP BY status
      ORDER BY status ASC`,
    [since, until]
  );

  const [accessByDevice] = await connection.query(
    `SELECT userType,
            COALESCE(NULLIF(os, ''), '(not recorded)') AS os,
            COALESCE(NULLIF(browser, ''), '(not recorded)') AS browser,
            COUNT(*) AS accesses,
            COUNT(DISTINCT studentId) AS uniqueStudents
       FROM access_logs
      WHERE accessedAt >= ? AND accessedAt < ?
      GROUP BY userType, COALESCE(NULLIF(os, ''), '(not recorded)'), COALESCE(NULLIF(browser, ''), '(not recorded)')
      ORDER BY accesses DESC, userType ASC, os ASC, browser ASC`,
    [since, until]
  );

  const aiTotals = aiTotalsRows[0];
  const successRate = Number(aiTotals.calls) === 0 ? null : Number(aiTotals.successes) / Number(aiTotals.calls);
  const failureRate = Number(aiTotals.calls) === 0 ? null : Number(aiTotals.failures) / Number(aiTotals.calls);
  const adoptionRate = Number(baseCounts[0].teachersActiveApproved) === 0
    ? null
    : Number(aiTotals.uniqueTeachers) / Number(baseCounts[0].teachersActiveApproved);
  const questionAccuracy = Number(assessmentQuestionAccuracy[0].answerRows) === 0
    ? null
    : Number(assessmentQuestionAccuracy[0].correctAnswers) / Number(assessmentQuestionAccuracy[0].answerRows);

  const output = {
    metadata: {
      generatedAtUtc: new Date().toISOString(),
      databaseName: period.databaseName,
      periodDays: DAYS,
      analysisStart: period.analysisStart,
      analysisEnd: period.analysisEnd,
      dataHandling: "Only aggregate, pseudonym-free queries were executed. No names, emails, registration numbers, prompts, responses, IP addresses, or user-agent strings were written to this output.",
    },
    baseCounts: Object.fromEntries(Object.entries(baseCounts[0]).map(([key, value]) => [key, asNumber(value)])),
    allTimeCoverage: allTimeCoverage.map((row) => ({
      sourceTable: row.sourceTable,
      rows: asNumber(row.rowCount),
      firstEventAt: row.firstEventAt,
      lastEventAt: row.lastEventAt,
    })),
    aiUsage: {
      totals: {
        calls: asNumber(aiTotals.calls),
        successes: asNumber(aiTotals.successes),
        failures: asNumber(aiTotals.failures),
        successRate,
        failureRate,
        uniqueTeachers: asNumber(aiTotals.uniqueTeachers),
        adoptionRateAmongActiveApprovedTeachers: adoptionRate,
        totalTokens: asNumber(aiTotals.totalTokens),
        avgTokensPerCall: asNumber(aiTotals.avgTokensPerCall),
        avgPromptTokens: asNumber(aiTotals.avgPromptTokens),
        avgCompletionTokens: asNumber(aiTotals.avgCompletionTokens),
        firstCallAt: aiTotals.firstCallAt,
        lastCallAt: aiTotals.lastCallAt,
      },
      byFeature: aiByFeature.map((row) => ({
        feature: row.feature,
        calls: asNumber(row.calls),
        successes: asNumber(row.successes),
        failures: asNumber(row.failures),
        uniqueTeachers: asNumber(row.uniqueTeachers),
        totalTokens: asNumber(row.totalTokens),
      })),
      byModel: aiByModel.map((row) => ({
        provider: row.provider,
        model: row.model,
        calls: asNumber(row.calls),
        successes: asNumber(row.successes),
        failures: asNumber(row.failures),
        totalTokens: asNumber(row.totalTokens),
      })),
      daily: aiByDay.map((row) => ({
        date: row.date,
        calls: asNumber(row.calls),
        successes: asNumber(row.successes),
        failures: asNumber(row.failures),
      })),
    },
    persistedAiArtifacts: {
      cacheByType: cacheByType.map((row) => ({
        analysisType: row.analysisType,
        entries: asNumber(row.entries),
        uniqueTeachers: asNumber(row.uniqueTeachers),
        totalCacheHits: asNumber(row.totalCacheHits),
        inputBytes: asNumber(row.inputBytes),
        outputBytes: asNumber(row.outputBytes),
        firstCreatedAt: row.firstCreatedAt,
        lastCreatedAt: row.lastCreatedAt,
      })),
      insightsByType: insightsByType.map((row) => ({
        insightType: row.insightType,
        insights: asNumber(row.insights),
        uniqueStudents: asNumber(row.uniqueStudents),
        uniqueTeachers: asNumber(row.uniqueTeachers),
        actionableInsights: asNumber(row.actionableInsights),
        dismissedInsights: asNumber(row.dismissedInsights),
      })),
    },
    directStudentSupport: Object.fromEntries(Object.entries(directStudentSupport[0]).map(([key, value]) => [key, asNumber(value)])),
    hints: hintStats.map((row) => ({
      hintType: row.hintType,
      hints: asNumber(row.hints),
      avgConfidence: asNumber(row.avgConfidence),
      firstGeneratedAt: row.firstGeneratedAt,
      lastGeneratedAt: row.lastGeneratedAt,
    })),
    exerciseAiFeedback: Object.fromEntries(Object.entries(exerciseAiFeedback[0]).map(([key, value]) => [key, asNumber(value)])),
    aiArtifactCoverage: Object.fromEntries(Object.entries(aiArtifactCoverage[0]).map(([key, value]) => [key, asNumber(value)])),
    studyTips: Object.fromEntries(Object.entries(studyTipDistribution[0]).map(([key, value]) => [key, asNumber(value)])),
    progressByStudyTipCohort: progressByTipCohort.map((row) => ({
      cohort: row.cohort,
      studentsWithTrackedProgress: asNumber(row.studentsWithTrackedProgress),
      completedTopics: asNumber(row.completedTopics),
      trackedTopics: asNumber(row.trackedTopics),
      meanCompletionRate: asNumber(row.meanCompletionRate),
    })),
    assessments: {
      scoreDistributionAllAssessments: summarize(assessmentScores.map((row) => row.percentage)),
      questionAccuracyAllAssessments: {
        answerRows: asNumber(assessmentQuestionAccuracy[0].answerRows),
        correctAnswers: asNumber(assessmentQuestionAccuracy[0].correctAnswers),
        accuracyRate: questionAccuracy,
        distinctQuestions: asNumber(assessmentQuestionAccuracy[0].distinctQuestions),
        distinctAttempts: asNumber(assessmentQuestionAccuracy[0].distinctAttempts),
      },
      lifecycleByStatus: assessmentLifecycle.map((row) => ({
        status: row.status,
        assessments: asNumber(row.assessments),
        firstCreatedAt: row.firstCreatedAt,
        lastCreatedAt: row.lastCreatedAt,
      })),
    },
    behavior: {
      byType: behaviorByType.map((row) => ({
        behaviorType: row.behaviorType,
        records: asNumber(row.records),
        uniqueStudents: asNumber(row.uniqueStudents),
      })),
      daily: behaviorByDay.map((row) => ({ date: row.date, records: asNumber(row.records) })),
    },
    learningProgress: {
      byStatus: progressSummaryRows.map((row) => ({
        status: row.status,
        rows: asNumber(row.rowCount),
        uniqueStudents: asNumber(row.uniqueStudents),
      })),
    },
    access: {
      byDeviceFamily: accessByDevice.map((row) => ({
        userType: row.userType,
        os: row.os,
        browser: row.browser,
        accesses: asNumber(row.accesses),
        uniqueStudents: asNumber(row.uniqueStudents),
      })),
    },
    limitations: [
      "The tables for learning trails, assessments, materials, and behavior records do not store a reliable aiGenerated flag or a generation-to-publication lineage. AI versus non-AI comparisons are therefore not identified from the current database alone.",
      "The ai_usage_logs table stores provider, model, feature, token totals, success status, and timestamps, but does not store request latency, cost, prompt version, generation response, schema-validation result, or human-review/publish decisions.",
      "Assessment tables store outcomes but do not label an assessment or a question as AI-generated, nor record question-level edit, discard, answer-key-error, or correction-completion events.",
      "Access logs contain operating system and browser but do not link a visit to an AI feature, so device-level AI use cannot be measured reliably.",
      "No validated teaching modality, institutional level, location, internet-access, disability/accommodation, perceived-benefit, or self-reported time-saving fields were found in the analyzed operational tables.",
    ],
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote anonymized 70-day aggregate profile: ${OUTPUT_PATH}`);
  console.log(JSON.stringify({
    periodStart: output.metadata.analysisStart,
    periodEnd: output.metadata.analysisEnd,
    aiCalls: output.aiUsage.totals.calls,
    aiSuccessRate: output.aiUsage.totals.successRate,
    aiFeatures: output.aiUsage.byFeature.length,
    studentsWithAiInsights: output.directStudentSupport.studentsWithAiInsights,
  }, null, 2));
} finally {
  await connection.end();
}
