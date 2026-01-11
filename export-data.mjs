#!/usr/bin/env node

/**
 * Script de Exportação de Dados - Sistema de Gestão de Tempo para Professores
 * 
 * Este script exporta todos os dados importantes do sistema em formato CSV para backup.
 * Gera arquivos separados para: disciplinas, turmas, turnos, horários, aulas agendadas e eventos.
 * 
 * Uso: node export-data.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import 'dotenv/config';
import { mysqlTable, int, varchar, text, timestamp } from 'drizzle-orm/mysql-core';

// Definir schemas inline para evitar problemas de import TypeScript
const subjects = mysqlTable('subjects', {});
const classes = mysqlTable('classes', {});
const shifts = mysqlTable('shifts', {});
const timeSlots = mysqlTable('time_slots', {});
const scheduledClasses = mysqlTable('scheduled_classes', {});
const calendarEvents = mysqlTable('calendar_events', {});

// Função para escapar valores CSV
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Função para converter array de objetos em CSV
function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }
  
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => escapeCSV(row[header]));
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Função principal de exportação
async function exportData() {
  console.log('🚀 Iniciando exportação de dados...\n');
  
  // Verificar DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não encontrada nas variáveis de ambiente');
    process.exit(1);
  }
  
  // Conectar ao banco
  const db = drizzle(process.env.DATABASE_URL);
  
  // Criar diretório de backup com timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = join(process.cwd(), 'backups', `backup_${timestamp}`);
  
  try {
    await mkdir(backupDir, { recursive: true });
    console.log(`📁 Diretório de backup criado: ${backupDir}\n`);
  } catch (error) {
    console.error('❌ Erro ao criar diretório de backup:', error.message);
    process.exit(1);
  }
  
  // Exportar Disciplinas
  try {
    console.log('📚 Exportando disciplinas...');
    const subjectsData = await db.select().from(subjects);
    const subjectsHeaders = [
      'id', 'name', 'code', 'description', 'color', 'userId',
      'ementa', 'generalObjective', 'specificObjectives', 'programContent',
      'basicBibliography', 'complementaryBibliography',
      'googleDriveUrl', 'googleClassroomUrl',
      'createdAt', 'updatedAt'
    ];
    const subjectsCSV = arrayToCSV(subjectsData, subjectsHeaders);
    const subjectsPath = join(backupDir, 'disciplinas.csv');
    await writeFile(subjectsPath, subjectsCSV);
    console.log(`   ✅ ${subjectsData.length} disciplinas exportadas`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar disciplinas:', error.message);
  }
  
  // Exportar Turmas
  try {
    console.log('👥 Exportando turmas...');
    const classesData = await db.select().from(classes);
    const classesHeaders = ['id', 'name', 'code', 'description', 'userId', 'createdAt', 'updatedAt'];
    const classesCSV = arrayToCSV(classesData, classesHeaders);
    const classesPath = join(backupDir, 'turmas.csv');
    await writeFile(classesPath, classesCSV);
    console.log(`   ✅ ${classesData.length} turmas exportadas`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar turmas:', error.message);
  }
  
  // Exportar Turnos
  try {
    console.log('🌅 Exportando turnos...');
    const shiftsData = await db.select().from(shifts);
    const shiftsHeaders = ['id', 'name', 'color', 'order', 'userId', 'createdAt', 'updatedAt'];
    const shiftsCSV = arrayToCSV(shiftsData, shiftsHeaders);
    const shiftsPath = join(backupDir, 'turnos.csv');
    await writeFile(shiftsPath, shiftsCSV);
    console.log(`   ✅ ${shiftsData.length} turnos exportados`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar turnos:', error.message);
  }
  
  // Exportar Horários
  try {
    console.log('⏰ Exportando horários...');
    const timeSlotsData = await db.select().from(timeSlots);
    const timeSlotsHeaders = ['id', 'shiftId', 'period', 'startTime', 'endTime', 'userId', 'createdAt', 'updatedAt'];
    const timeSlotsCSV = arrayToCSV(timeSlotsData, timeSlotsHeaders);
    const timeSlotsPath = join(backupDir, 'horarios.csv');
    await writeFile(timeSlotsPath, timeSlotsCSV);
    console.log(`   ✅ ${timeSlotsData.length} horários exportados`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar horários:', error.message);
  }
  
  // Exportar Aulas Agendadas
  try {
    console.log('📅 Exportando aulas agendadas...');
    const scheduledData = await db.select().from(scheduledClasses);
    const scheduledHeaders = ['id', 'subjectId', 'classId', 'timeSlotId', 'dayOfWeek', 'userId', 'createdAt', 'updatedAt'];
    const scheduledCSV = arrayToCSV(scheduledData, scheduledHeaders);
    const scheduledPath = join(backupDir, 'aulas_agendadas.csv');
    await writeFile(scheduledPath, scheduledCSV);
    console.log(`   ✅ ${scheduledData.length} aulas agendadas exportadas`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar aulas agendadas:', error.message);
  }
  
  // Exportar Eventos do Calendário
  try {
    console.log('📆 Exportando eventos do calendário...');
    const eventsData = await db.select().from(calendarEvents);
    const eventsHeaders = ['id', 'title', 'date', 'type', 'description', 'isRecurring', 'userId', 'createdAt', 'updatedAt'];
    const eventsCSV = arrayToCSV(eventsData, eventsHeaders);
    const eventsPath = join(backupDir, 'eventos_calendario.csv');
    await writeFile(eventsPath, eventsCSV);
    console.log(`   ✅ ${eventsData.length} eventos exportados`);
  } catch (error) {
    console.error('   ❌ Erro ao exportar eventos:', error.message);
  }
  
  // Criar arquivo README no backup
  const readmePath = join(backupDir, 'README.txt');
  const readmeContent = `BACKUP DO SISTEMA DE GESTÃO DE TEMPO PARA PROFESSORES
Data: ${new Date().toLocaleString('pt-BR')}
Timestamp: ${timestamp}

Arquivos incluídos:
- disciplinas.csv: Todas as disciplinas com planos de curso e links Google
- turmas.csv: Todas as turmas cadastradas
- turnos.csv: Configuração de turnos (Matutino, Vespertino, Noturno)
- horarios.csv: Horários de cada turno
- aulas_agendadas.csv: Grade de horários completa
- eventos_calendario.csv: Eventos e datas comemorativas

Para restaurar os dados, importe os arquivos CSV na ordem:
1. turnos.csv
2. horarios.csv
3. disciplinas.csv
4. turmas.csv
5. aulas_agendadas.csv
6. eventos_calendario.csv

Sistema: ${process.env.VITE_APP_TITLE || 'Sistema de Gestão de Tempo para Professores'}
`;
  
  await writeFile(readmePath, readmeContent);
  
  console.log('\n✨ Exportação concluída com sucesso!');
  console.log(`📂 Arquivos salvos em: ${backupDir}`);
  console.log('\n📋 Arquivos gerados:');
  console.log('   - disciplinas.csv');
  console.log('   - turmas.csv');
  console.log('   - turnos.csv');
  console.log('   - horarios.csv');
  console.log('   - aulas_agendadas.csv');
  console.log('   - eventos_calendario.csv');
  console.log('   - README.txt');
}

// Função auxiliar para escrever arquivo (compatível com promises)
function writeFile(path, content) {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(path);
    stream.write(content, 'utf8');
    stream.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Executar exportação
exportData().catch(error => {
  console.error('\n❌ Erro fatal durante exportação:', error);
  process.exit(1);
});
