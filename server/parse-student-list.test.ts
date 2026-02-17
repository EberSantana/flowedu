import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import parseStudentListRouter from './parse-student-list';

// Create a test app
function createTestApp() {
  const app = express();
  app.use('/api', parseStudentListRouter);
  return app;
}

describe('Parse Student List Endpoint', () => {
  it('should return error when no file is sent', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/parse-student-list')
      .expect(400);
    
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Nenhum arquivo');
  });

  it('should parse a .txt file with tab-separated data', async () => {
    const app = createTestApp();
    
    // Create a temp txt file
    const content = "Matrícula\tNome\n2024001\tJoão da Silva\n2024002\tMaria Santos\n2024003\tPedro Oliveira";
    const tmpFile = '/tmp/test_students.txt';
    fs.writeFileSync(tmpFile, content);
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', tmpFile)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(3);
    expect(res.body.students[0].registrationNumber).toBe('2024001');
    expect(res.body.students[0].fullName).toBe('João da Silva');
    expect(res.body.students[1].registrationNumber).toBe('2024002');
    expect(res.body.students[1].fullName).toBe('Maria Santos');
    
    fs.unlinkSync(tmpFile);
  });

  it('should parse a .csv file with comma-separated data', async () => {
    const app = createTestApp();
    
    const content = "Matrícula,Nome\n2024001,João da Silva\n2024002,Maria Santos";
    const tmpFile = '/tmp/test_students.csv';
    fs.writeFileSync(tmpFile, content);
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', tmpFile)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.students[0].registrationNumber).toBe('2024001');
    expect(res.body.students[0].fullName).toBe('João da Silva');
    
    fs.unlinkSync(tmpFile);
  });

  it('should parse a .txt file with space-separated data', async () => {
    const app = createTestApp();
    
    const content = "2024001  João da Silva\n2024002  Maria Santos\n2024003  Pedro Oliveira";
    const tmpFile = '/tmp/test_students_space.txt';
    fs.writeFileSync(tmpFile, content);
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', tmpFile)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(3);
    expect(res.body.students[0].registrationNumber).toBe('2024001');
    expect(res.body.students[0].fullName).toBe('João da Silva');
    
    fs.unlinkSync(tmpFile);
  });

  it('should skip header lines and non-student lines', async () => {
    const app = createTestApp();
    
    const content = "TIOPTSEGIN01 - CC - SEGURANÇA DA INFORMAÇÃO - TIMS31 (2026)\nMatrícula\tNome\n2024300543\tANA CLARA BARRETO VASCONCELOS\n2024301353\tANDRIA SOUZA DE ASSUNCAO";
    const tmpFile = '/tmp/test_students_header.txt';
    fs.writeFileSync(tmpFile, content);
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', tmpFile)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.students[0].registrationNumber).toBe('2024300543');
    expect(res.body.students[0].fullName).toBe('ANA CLARA BARRETO VASCONCELOS');
    
    fs.unlinkSync(tmpFile);
  });

  it('should parse the real LISTADECHAMADA.docx file if available', async () => {
    const docxPath = '/home/ubuntu/upload/LISTADECHAMADA.docx';
    if (!fs.existsSync(docxPath)) {
      console.log('LISTADECHAMADA.docx not found, skipping test');
      return;
    }
    
    const app = createTestApp();
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', docxPath)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students.length).toBeGreaterThan(20);
    expect(res.body.students[0]).toHaveProperty('registrationNumber');
    expect(res.body.students[0]).toHaveProperty('fullName');
    
    // Verify specific students from the file
    const ana = res.body.students.find((s: any) => s.fullName.includes('ANA CLARA'));
    expect(ana).toBeDefined();
    expect(ana.registrationNumber).toBe('2024300543');
  });

  it('should return empty array for file with no student data', async () => {
    const app = createTestApp();
    
    const content = "Este é um arquivo sem dados de alunos\nApenas texto normal";
    const tmpFile = '/tmp/test_no_students.txt';
    fs.writeFileSync(tmpFile, content);
    
    const res = await request(app)
      .post('/api/parse-student-list')
      .attach('file', tmpFile)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.students).toHaveLength(0);
    
    fs.unlinkSync(tmpFile);
  });
});
