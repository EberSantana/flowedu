import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Sistema de Aprendizagem Guiada', () => {
  let testProfessorId: number;
  let testStudentId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testTopicId: number;
  let testEnrollmentId: number;

  beforeAll(async () => {
    // Usar IDs de usuários existentes
    testProfessorId = 1;
    testStudentId = 1; // Usar mesmo usuário para simplificar
    
    // Buscar ou criar disciplina de teste
    const subjects = await db.getSubjectsByUserId(testProfessorId);
    if (subjects.length > 0) {
      testSubjectId = subjects[0].id;
    } else {
      const subjectResult = await db.createSubject({
        name: 'Disciplina Teste',
        code: 'TEST-001',
        description: 'Teste',
        workload: 60,
        userId: testProfessorId,
      });
      testSubjectId = Number(subjectResult.insertId);
    }

    // Buscar ou criar módulo de teste
    const modules = await db.getLearningPathBySubject(testSubjectId, testProfessorId);
    if (modules.length > 0 && modules[0].topics && modules[0].topics.length > 0) {
      testModuleId = modules[0].id;
      testTopicId = modules[0].topics[0].id;
    } else {
      const module = await db.createLearningModule({
        subjectId: testSubjectId,
        title: 'Módulo Teste',
        description: 'Teste',
        userId: testProfessorId,
      });
      testModuleId = module.id;
      
      const topic = await db.createLearningTopic({
        moduleId: testModuleId,
        title: 'Tópico Teste',
        description: 'Teste',
        estimatedHours: 2,
        theoryHours: 1,
        practiceHours: 1,
        individualWorkHours: 0,
        teamWorkHours: 0,
        userId: testProfessorId,
      });
      testTopicId = topic.id;
    }
  });

  describe('Matrículas de Alunos', () => {
    it('deve criar uma matrícula de aluno', async () => {
      const enrollment = await db.createStudentEnrollment({
        studentId: testStudentId,
        subjectId: testSubjectId,
        professorId: testProfessorId,
      });

      expect(enrollment).toBeDefined();
      expect(enrollment.id).toBeGreaterThan(0);
      expect(enrollment.status).toBe('active');
      testEnrollmentId = enrollment.id;
    });

    it('deve listar matrículas do aluno', async () => {
      const enrollments = await db.getStudentEnrollments(testStudentId);
      
      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeGreaterThan(0);
      expect(enrollments.some(e => e.subjectId === testSubjectId)).toBe(true);
    });

    it('deve listar matrículas por disciplina', async () => {
      const enrollments = await db.getEnrollmentsBySubject(testSubjectId, testProfessorId);
      
      expect(Array.isArray(enrollments)).toBe(true);
      expect(enrollments.length).toBeGreaterThan(0);
      expect(enrollments.some(e => e.studentId === testStudentId)).toBe(true);
    });

    it('deve atualizar status da matrícula', async () => {
      const result = await db.updateEnrollmentStatus(testEnrollmentId, 'completed', testProfessorId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Progresso do Aluno', () => {
    it('deve criar/atualizar progresso do aluno em um tópico', async () => {
      const progress = await db.updateStudentTopicProgress({
        studentId: testStudentId,
        topicId: testTopicId,
        status: 'in_progress',
        selfAssessment: 'understood',
        notes: 'Anotações de teste',
      });

      expect(progress).toBeDefined();
      expect(progress.status).toBe('in_progress');
      expect(progress.selfAssessment).toBe('understood');
    });

    it('deve buscar progresso do aluno em um tópico', async () => {
      const progress = await db.getStudentTopicProgress(testStudentId, testTopicId);
      
      expect(progress).toBeDefined();
      expect(progress?.topicId).toBe(testTopicId);
      expect(progress?.studentId).toBe(testStudentId);
    });

    it('deve marcar tópico como concluído', async () => {
      const progress = await db.updateStudentTopicProgress({
        studentId: testStudentId,
        topicId: testTopicId,
        status: 'completed',
      });

      expect(progress.status).toBe('completed');
      expect(progress.completedAt).toBeDefined();
    });

    it('deve buscar progresso do aluno por disciplina', async () => {
      const progressList = await db.getStudentProgressBySubject(testStudentId, testSubjectId);
      
      expect(Array.isArray(progressList)).toBe(true);
      expect(progressList.some(p => p.topicId === testTopicId)).toBe(true);
    });
  });

  describe('Materiais Didáticos', () => {
    let testMaterialId: number;

    it('deve criar material didático para um tópico', async () => {
      const material = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Material Teste',
        description: 'Descrição do material',
        type: 'pdf',
        url: 'https://example.com/material.pdf',
        isRequired: true,
      });

      expect(material).toBeDefined();
      expect(material.id).toBeGreaterThan(0);
      expect(material.title).toBe('Material Teste');
      testMaterialId = material.id;
    });

    it('deve listar materiais de um tópico', async () => {
      const materials = await db.getTopicMaterials(testTopicId);
      
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBeGreaterThan(0);
      expect(materials.some(m => m.id === testMaterialId)).toBe(true);
    });

    it('deve atualizar material didático', async () => {
      const result = await db.updateTopicMaterial(
        testMaterialId,
        { title: 'Material Atualizado' },
        testProfessorId
      );

      expect(result.success).toBe(true);
    });

    it('deve deletar material didático', async () => {
      const result = await db.deleteTopicMaterial(testMaterialId, testProfessorId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Atividades e Entregas', () => {
    let testAssignmentId: number;
    let testSubmissionId: number;

    it('deve criar atividade para um tópico', async () => {
      const assignment = await db.createTopicAssignment({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Atividade Teste',
        description: 'Descrição da atividade',
        type: 'exercise',
        maxScore: 100,
        isRequired: true,
      });

      expect(assignment).toBeDefined();
      expect(assignment.id).toBeGreaterThan(0);
      testAssignmentId = assignment.id;
    });

    it('deve listar atividades de um tópico', async () => {
      const assignments = await db.getTopicAssignments(testTopicId);
      
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThan(0);
      expect(assignments.some(a => a.id === testAssignmentId)).toBe(true);
    });

    it('deve criar entrega de atividade pelo aluno', async () => {
      const submission = await db.createAssignmentSubmission({
        assignmentId: testAssignmentId,
        studentId: testStudentId,
        content: 'Resposta do aluno',
      });

      expect(submission).toBeDefined();
      expect(submission.id).toBeGreaterThan(0);
      expect(submission.status).toBe('pending');
      testSubmissionId = submission.id;
    });

    it('deve buscar entrega do aluno', async () => {
      const submission = await db.getStudentSubmission(testAssignmentId, testStudentId);
      
      expect(submission).toBeDefined();
      expect(submission?.id).toBe(testSubmissionId);
    });

    it('deve corrigir entrega do aluno', async () => {
      const result = await db.gradeSubmission(testSubmissionId, {
        score: 85,
        feedback: 'Bom trabalho!',
        gradedBy: testProfessorId,
      });

      expect(result.success).toBe(true);
    });

    it('deve deletar atividade', async () => {
      const result = await db.deleteTopicAssignment(testAssignmentId, testProfessorId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Comentários e Feedback', () => {
    let testCommentId: number;

    it('deve criar comentário do professor', async () => {
      const comment = await db.createTopicComment({
        topicId: testTopicId,
        studentId: testStudentId,
        professorId: testProfessorId,
        authorId: testProfessorId,
        authorType: 'professor',
        content: 'Ótimo progresso!',
        isPrivate: true,
      });

      expect(comment).toBeDefined();
      expect(comment.id).toBeGreaterThan(0);
      testCommentId = comment.id;
    });

    it('deve listar comentários de um tópico', async () => {
      const comments = await db.getTopicComments(testTopicId, testStudentId, testProfessorId);
      
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThan(0);
      expect(comments.some(c => c.id === testCommentId)).toBe(true);
    });

    it('deve deletar comentário', async () => {
      const result = await db.deleteTopicComment(testCommentId, testProfessorId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Limpeza', () => {
    it('deve deletar matrícula de teste', async () => {
      const result = await db.deleteEnrollment(testEnrollmentId, testProfessorId);
      expect(result.success).toBe(true);
    });

    it('deve deletar tópico de teste', async () => {
      const result = await db.deleteLearningTopic(testTopicId, testProfessorId);
      expect(result.success).toBe(true);
    });

    it('deve deletar módulo de teste', async () => {
      const result = await db.deleteLearningModule(testModuleId, testProfessorId);
      expect(result.success).toBe(true);
    });

    it('deve deletar disciplina de teste', async () => {
      await db.deleteSubject(testSubjectId, testProfessorId);
      const subject = await db.getSubjectById(testSubjectId, testProfessorId);
      expect(subject).toBeUndefined();
    });
  });
});
