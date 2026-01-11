import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Caderno de Exercícios', () => {
  // Testes básicos das funções do caderno
  
  it('deve ter função getStudentAnsweredQuestions definida', () => {
    expect(db.getStudentAnsweredQuestions).toBeDefined();
    expect(typeof db.getStudentAnsweredQuestions).toBe('function');
  });
  
  it('deve ter função toggleQuestionForReview definida', () => {
    expect(db.toggleQuestionForReview).toBeDefined();
    expect(typeof db.toggleQuestionForReview).toBe('function');
  });
  
  it('deve ter função updateQuestionMasteryStatus definida', () => {
    expect(db.updateQuestionMasteryStatus).toBeDefined();
    expect(typeof db.updateQuestionMasteryStatus).toBe('function');
  });
  
  it('deve ter função incrementQuestionReviewCount definida', () => {
    expect(db.incrementQuestionReviewCount).toBeDefined();
    expect(typeof db.incrementQuestionReviewCount).toBe('function');
  });
  
  it('deve ter função getStudentNotebookStats definida', () => {
    expect(db.getStudentNotebookStats).toBeDefined();
    expect(typeof db.getStudentNotebookStats).toBe('function');
  });
});
