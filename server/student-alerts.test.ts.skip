import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Sistema de Alertas para Alunos", () => {
  let teacherUser: any;
  let studentUser: any;
  let subject: any;
  let announcement: any;
  let task: any;

  beforeEach(async () => {
    // Criar usuário professor usando upsertUser
    const teacherOpenId = `teacher-${Date.now()}-${Math.random()}`;
    await db.upsertUser({
      openId: teacherOpenId,
      name: "Professor Teste",
      email: `teacher-${Date.now()}@test.com`,
      role: "user",
    });
    teacherUser = await db.getUserByOpenId(teacherOpenId);

    // Criar usuário aluno
    studentUser = await db.createStudent({
      userId: teacherUser!.id,
      fullName: "Aluno Teste",
      registrationNumber: `ENR${Date.now()}`,
    });

    // Criar disciplina
    subject = await db.createSubject({
      name: "Disciplina Teste",
      code: `DISC${Date.now()}`,
      description: "Descrição teste",
      color: "#3b82f6",
      userId: teacherUser.id,
    });

    // Matricular aluno na disciplina
    await db.createStudentEnrollment({
      studentId: studentUser.id,
      subjectId: subject.id,
      professorId: teacherUser!.id,
    });
  });

  describe("Avisos Importantes", () => {
    it("deve listar avisos importantes para o aluno", async () => {
      // Criar aviso importante
      announcement = await db.createAnnouncement({
        subjectId: subject.id,
        userId: teacherUser!.id,
        title: "Aviso Importante",
        message: "Mensagem de teste",
        isImportant: true,
      });

      const caller = appRouter.createCaller({
        user: null,
        student: studentUser,
      });

      const announcements = await caller.announcements.getForStudent();

      expect(announcements).toBeDefined();
      expect(announcements.length).toBeGreaterThan(0);
      
      const importantAnnouncement = announcements.find(
        (a: any) => a.id === announcement.id
      );
      expect(importantAnnouncement).toBeDefined();
      expect(importantAnnouncement?.isImportant).toBe(true);
    });

    it("deve contar avisos não lidos corretamente", async () => {
      // Criar múltiplos avisos importantes
      await db.createAnnouncement({
        subjectId: subject.id,
        userId: teacherUser!.id,
        title: "Aviso 1",
        message: "Mensagem 1",
        isImportant: true,
      });

      await db.createAnnouncement({
        subjectId: subject.id,
        userId: teacherUser!.id,
        title: "Aviso 2",
        message: "Mensagem 2",
        isImportant: true,
      });

      const caller = appRouter.createCaller({
        user: null,
        student: studentUser,
      });

      const unreadCount = await caller.announcements.getUnreadCount();

      expect(unreadCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Tarefas Pendentes", () => {
    it("deve listar tarefas não completadas", async () => {
      // Criar tarefa pendente
      task = await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Teste",
        description: "Descrição da tarefa",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias no futuro
      });

      const caller = appRouter.createCaller({
        user: teacherUser,
        student: null,
      });

      const tasks = await caller.tasks.getByFilter({ completed: false });

      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);
      
      const pendingTask = tasks.find((t: any) => t.id === task.id);
      expect(pendingTask).toBeDefined();
      expect(pendingTask?.completed).toBe(false);
    });

    it("deve filtrar tarefas por prioridade", async () => {
      // Criar tarefas com diferentes prioridades
      await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Alta Prioridade",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Baixa Prioridade",
        priority: "low",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const caller = appRouter.createCaller({
        user: teacherUser,
        student: null,
      });

      const highPriorityTasks = await caller.tasks.getByFilter({ 
        completed: false,
        priority: "high"
      });

      expect(highPriorityTasks).toBeDefined();
      expect(highPriorityTasks.length).toBeGreaterThan(0);
      expect(highPriorityTasks.every((t: any) => t.priority === "high")).toBe(true);
    });

    it("deve identificar tarefas próximas do vencimento", async () => {
      // Criar tarefa com vencimento próximo (1 dia)
      const nearDueTask = await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Urgente",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const caller = appRouter.createCaller({
        user: teacherUser,
        student: null,
      });

      const tasks = await caller.tasks.getByFilter({ completed: false });
      const urgentTask = tasks.find((t: any) => t.id === nearDueTask.id);

      expect(urgentTask).toBeDefined();
      
      // Verificar que a data de vencimento está próxima
      const dueDate = new Date(urgentTask!.dueDate!);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysUntilDue).toBeLessThanOrEqual(3);
    });

    it("deve identificar tarefas vencidas", async () => {
      // Criar tarefa vencida (1 dia atrás)
      const overdueTask = await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Vencida",
        priority: "high",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const caller = appRouter.createCaller({
        user: teacherUser,
        student: null,
      });

      const tasks = await caller.tasks.getByFilter({ completed: false });
      const overdue = tasks.find((t: any) => t.id === overdueTask.id);

      expect(overdue).toBeDefined();
      
      // Verificar que a tarefa está vencida
      const dueDate = new Date(overdue!.dueDate!);
      const now = new Date();
      
      expect(dueDate.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe("Integração de Alertas", () => {
    it("deve combinar avisos e tarefas em um único sistema de alertas", async () => {
      // Criar aviso importante
      await db.createAnnouncement({
        subjectId: subject.id,
        userId: teacherUser!.id,
        title: "Aviso Urgente",
        message: "Mensagem urgente",
        isImportant: true,
      });

      // Criar tarefa urgente
      await db.createTask({
        userId: teacherUser.id,
        title: "Tarefa Urgente",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const studentCaller = appRouter.createCaller({
        user: null,
        student: studentUser,
      });

      const teacherCaller = appRouter.createCaller({
        user: teacherUser,
        student: null,
      });

      const announcements = await studentCaller.announcements.getForStudent();
      const tasks = await teacherCaller.tasks.getByFilter({ completed: false });

      // Verificar que ambos os sistemas retornam dados
      expect(announcements.length).toBeGreaterThan(0);
      expect(tasks.length).toBeGreaterThan(0);

      // Simular a lógica de priorização de alertas
      const importantAnnouncements = announcements.filter((a: any) => a.isImportant);
      const urgentTasks = tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 3;
      });

      const totalAlerts = importantAnnouncements.length + urgentTasks.length;
      expect(totalAlerts).toBeGreaterThan(0);
    });
  });
});
