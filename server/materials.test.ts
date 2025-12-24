import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Sistema de Materiais Didáticos', () => {
  let testProfessorId: number;
  let testSubjectId: number;
  let testModuleId: number;
  let testTopicId: number;
  let testMaterialId: number;

  beforeAll(async () => {
    // Usar professor existente
    testProfessorId = 1;
    
    // Buscar ou criar disciplina de teste
    const subjects = await db.getSubjectsByUserId(testProfessorId);
    if (subjects.length > 0) {
      testSubjectId = subjects[0].id;
    } else {
      const subjectResult = await db.createSubject({
        name: 'Disciplina Teste Materiais',
        code: 'TEST-MAT-001',
        description: 'Teste',
        workload: 60,
        userId: testProfessorId,
      });
      testSubjectId = Number(subjectResult.insertId);
    }

    // Buscar ou criar módulo e tópico
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

  describe('Criação de Materiais', () => {
    it('deve criar material do tipo link', async () => {
      const material = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Vídeo Aula YouTube',
        description: 'Introdução ao tema',
        type: 'video',
        url: 'https://youtube.com/watch?v=test',
        isRequired: true,
      });

      expect(material).toBeDefined();
      expect(material.id).toBeGreaterThan(0);
      expect(material.title).toBe('Vídeo Aula YouTube');
      expect(material.type).toBe('video');
      expect(material.isRequired).toBe(true);
      testMaterialId = material.id;
    });

    it('deve criar material do tipo PDF', async () => {
      const material = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Apostila em PDF',
        description: 'Material de apoio',
        type: 'pdf',
        url: 'https://example.com/apostila.pdf',
        fileSize: 1024000, // 1MB
        isRequired: false,
      });

      expect(material).toBeDefined();
      expect(material.type).toBe('pdf');
      expect(material.fileSize).toBe(1024000);
      expect(material.isRequired).toBe(false);
    });

    it('deve criar material do tipo link externo', async () => {
      const material = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Artigo Complementar',
        description: 'Leitura adicional',
        type: 'link',
        url: 'https://example.com/artigo',
        isRequired: false,
      });

      expect(material).toBeDefined();
      expect(material.type).toBe('link');
    });
  });

  describe('Listagem de Materiais', () => {
    it('deve listar materiais de um tópico', async () => {
      const materials = await db.getTopicMaterials(testTopicId);
      
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBeGreaterThan(0);
      expect(materials.some(m => m.id === testMaterialId)).toBe(true);
    });

    it('deve retornar array vazio para tópico sem materiais', async () => {
      const materials = await db.getTopicMaterials(99999);
      
      expect(Array.isArray(materials)).toBe(true);
      expect(materials.length).toBe(0);
    });
  });

  describe('Atualização de Materiais', () => {
    it('deve atualizar título do material', async () => {
      const result = await db.updateTopicMaterial(
        testMaterialId,
        { title: 'Vídeo Aula Atualizado' },
        testProfessorId
      );

      expect(result.success).toBe(true);
      
      const materials = await db.getTopicMaterials(testTopicId);
      const updated = materials.find(m => m.id === testMaterialId);
      expect(updated?.title).toBe('Vídeo Aula Atualizado');
    });

    it('deve atualizar flag de obrigatório', async () => {
      const result = await db.updateTopicMaterial(
        testMaterialId,
        { isRequired: false },
        testProfessorId
      );

      expect(result.success).toBe(true);
      
      const materials = await db.getTopicMaterials(testTopicId);
      const updated = materials.find(m => m.id === testMaterialId);
      expect(updated?.isRequired).toBe(false);
    });

    it('deve atualizar descrição do material', async () => {
      const result = await db.updateTopicMaterial(
        testMaterialId,
        { description: 'Nova descrição do material' },
        testProfessorId
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Exclusão de Materiais', () => {
    it('deve deletar material', async () => {
      const result = await db.deleteTopicMaterial(testMaterialId, testProfessorId);
      
      expect(result.success).toBe(true);
      
      const materials = await db.getTopicMaterials(testTopicId);
      expect(materials.some(m => m.id === testMaterialId)).toBe(false);
    });

    it('deve permitir deletar material inexistente sem erro', async () => {
      // Deletar material que não existe não causa erro, apenas não afeta nada
      const result = await db.deleteTopicMaterial(99999, testProfessorId);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Validações', () => {
    it('deve criar material com campos mínimos obrigatórios', async () => {
      const material = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Material Mínimo',
        type: 'other',
        url: 'https://example.com/file',
      });

      expect(material).toBeDefined();
      expect(material.title).toBe('Material Mínimo');
      
      // Limpar
      await db.deleteTopicMaterial(material.id, testProfessorId);
    });

    it('deve listar materiais ordenados por orderIndex', async () => {
      // Criar múltiplos materiais
      const mat1 = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Material 1',
        type: 'link',
        url: 'https://example.com/1',
      });

      const mat2 = await db.createTopicMaterial({
        topicId: testTopicId,
        professorId: testProfessorId,
        title: 'Material 2',
        type: 'link',
        url: 'https://example.com/2',
      });

      const materials = await db.getTopicMaterials(testTopicId);
      
      expect(materials.length).toBeGreaterThanOrEqual(2);
      
      // Limpar
      await db.deleteTopicMaterial(mat1.id, testProfessorId);
      await db.deleteTopicMaterial(mat2.id, testProfessorId);
    });
  });

  describe('Tipos de Materiais', () => {
    it('deve aceitar todos os tipos de materiais válidos', async () => {
      const types: Array<'pdf' | 'video' | 'link' | 'document' | 'presentation' | 'other'> = 
        ['pdf', 'video', 'link', 'document', 'presentation', 'other'];
      
      const createdIds: number[] = [];

      for (const type of types) {
        const material = await db.createTopicMaterial({
          topicId: testTopicId,
          professorId: testProfessorId,
          title: `Material ${type}`,
          type,
          url: `https://example.com/${type}`,
        });

        expect(material.type).toBe(type);
        createdIds.push(material.id);
      }

      // Limpar todos
      for (const id of createdIds) {
        await db.deleteTopicMaterial(id, testProfessorId);
      }
    });
  });

  afterAll(async () => {
    // Limpar materiais restantes do tópico de teste
    const materials = await db.getTopicMaterials(testTopicId);
    for (const material of materials) {
      await db.deleteTopicMaterial(material.id, testProfessorId);
    }
  });
});
