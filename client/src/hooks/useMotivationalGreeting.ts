import { useMemo } from "react";

// ─── Frases motivacionais rotativas (por dia do ano) ───────────────────────
const FRASES = [
  "\"A educação é a arma mais poderosa que você pode usar para mudar o mundo.\" — Nelson Mandela",
  "\"O sucesso é a soma de pequenos esforços repetidos dia após dia.\" — Robert Collier",
  "\"Ensinar não é transferir conhecimento, mas criar possibilidades para a sua produção.\" — Paulo Freire",
  "\"A melhor maneira de prever o futuro é criá-lo.\" — Peter Drucker",
  "\"O conhecimento é o único bem que aumenta quando compartilhado.\" — Anônimo",
  "\"Cada aluno é uma oportunidade de fazer diferença no mundo.\" — Anônimo",
  "\"A persistência é o caminho do êxito.\" — Charles Chaplin",
  "\"Educar é semear com sabedoria e colher com paciência.\" — Rousseau",
  "\"O professor medíocre conta. O bom professor explica. O professor excelente demonstra.\" — William Ward",
  "\"Aprender é a única coisa de que a mente nunca se cansa.\" — Leonardo da Vinci",
  "\"A educação não muda o mundo, ela muda as pessoas que vão mudar o mundo.\" — Paulo Freire",
  "\"O entusiasmo é a maior força da alma.\" — Ralph Waldo Emerson",
  "\"Investir em conhecimento sempre paga os melhores juros.\" — Benjamin Franklin",
  "\"Nenhum de nós é tão inteligente quanto todos nós juntos.\" — Ken Blanchard",
  "\"A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.\" — Albert Einstein",
  "\"O segredo do sucesso é a constância do propósito.\" — Benjamin Disraeli",
  "\"Você não pode ensinar nada a um homem; você pode apenas ajudá-lo a encontrar a resposta dentro dele.\" — Galileu",
  "\"O único lugar onde o sucesso vem antes do trabalho é no dicionário.\" — Albert Einstein",
  "\"Educar a mente sem educar o coração não é educação.\" — Aristóteles",
  "\"A maior recompensa do trabalho não é o que você ganha com ele, mas o que você se torna com ele.\" — John Ruskin",
  "\"O aprendizado nunca esgota a mente.\" — Leonardo da Vinci",
  "\"Cada criança que ensinamos é um ser humano que educamos.\" — Victor Hugo",
  "\"O professor que inspira seus alunos é mais valioso do que o que apenas informa.\" — Anônimo",
  "\"A educação é o passaporte para o futuro.\" — Malcolm X",
  "\"Não há ensino sem pesquisa nem pesquisa sem ensino.\" — Paulo Freire",
  "\"O talento vence jogos, mas só o trabalho em equipe vence campeonatos.\" — Michael Jordan",
  "\"A disciplina é a ponte entre metas e realizações.\" — Jim Rohn",
  "\"Acredite que você pode e você já está na metade do caminho.\" — Theodore Roosevelt",
  "\"O sucesso não é final, o fracasso não é fatal: o que conta é a coragem de continuar.\" — Winston Churchill",
  "\"Grandes conquistas exigem grandes sacrifícios.\" — Anônimo",
];

function getFraseDodia(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return FRASES[dayOfYear % FRASES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 18) return "🌤";
  return "🌙";
}

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface GreetingChip {
  icon: string;
  value: string | number;
  label: string;
  highlight?: boolean; // destaque em laranja/vermelho quando há pendências
}

export interface MotivationalGreeting {
  greeting: string;       // "Bom dia, Eber!"
  emoji: string;          // "☀️"
  message: string;        // mensagem dinâmica com dados reais
  urgency: "low" | "medium" | "high"; // nível de urgência para cor do banner
  chips: GreetingChip[];
  frase: string;
}

// ─── Hook para o PROFESSOR ─────────────────────────────────────────────────

interface ProfessorGreetingInput {
  name?: string;
  todayClassesCount?: number;
  pendingDoubtsCount?: number;
  subjectsCount?: number;
  classesCount?: number;
}

export function useProfessorGreeting(input: ProfessorGreetingInput): MotivationalGreeting {
  return useMemo(() => {
    const firstName = input.name?.split(" ")[0] || "Professor";
    const greeting = getGreeting();
    const emoji = getGreetingEmoji();
    const today = input.todayClassesCount ?? 0;
    const doubts = input.pendingDoubtsCount ?? 0;
    const subjects = input.subjectsCount ?? 0;
    const classes = input.classesCount ?? 0;

    // ── Lógica de mensagem por prioridade ──
    let message = "";
    let urgency: "low" | "medium" | "high" = "low";

    if (doubts > 5) {
      urgency = "high";
      message = `Atenção: você tem ${doubts} dúvida${doubts !== 1 ? "s" : ""} de alunos aguardando resposta.`;
    } else if (today > 0 && doubts > 0) {
      urgency = "medium";
      message = `Você tem ${today} aula${today !== 1 ? "s" : ""} hoje e ${doubts} dúvida${doubts !== 1 ? "s" : ""} pendente${doubts !== 1 ? "s" : ""} para responder.`;
    } else if (today > 0) {
      urgency = "low";
      message = `Você tem ${today} aula${today !== 1 ? "s" : ""} hoje. Boa aula! 🎓`;
    } else if (doubts > 0) {
      urgency = "medium";
      message = `Sem aulas hoje, mas ${doubts} dúvida${doubts !== 1 ? "s" : ""} de alunos aguarda${doubts === 1 ? "" : "m"} sua resposta.`;
    } else {
      urgency = "low";
      message = "Nenhuma pendência hoje. Aproveite para planejar a próxima semana! 📅";
    }

    // ── Chips de dados ──
    const chips: GreetingChip[] = [];
    if (subjects > 0) chips.push({ icon: "📚", value: subjects, label: "Disciplinas" });
    if (classes > 0) chips.push({ icon: "👥", value: classes, label: "Turmas" });
    if (today > 0) chips.push({ icon: "📅", value: today, label: "Aulas hoje" });
    if (doubts > 0) chips.push({ icon: "💬", value: doubts, label: "Dúvidas pendentes", highlight: true });

    return {
      greeting: `${greeting}, ${firstName}!`,
      emoji,
      message,
      urgency,
      chips,
      frase: getFraseDodia(),
    };
  }, [input.name, input.todayClassesCount, input.pendingDoubtsCount, input.subjectsCount, input.classesCount]);
}

// ─── Hook para o ALUNO ─────────────────────────────────────────────────────

interface StudentGreetingInput {
  name?: string;
  activeSubjectsCount?: number;
  pendingExercisesCount?: number;
  unreadAnnouncementsCount?: number;
  unseenAnswersCount?: number;
  overallProgressPercent?: number; // média de progresso nas disciplinas
}

export function useStudentGreeting(input: StudentGreetingInput): MotivationalGreeting {
  return useMemo(() => {
    const firstName = input.name?.split(" ")[0] || "Aluno";
    const greeting = getGreeting();
    const emoji = getGreetingEmoji();
    const subjects = input.activeSubjectsCount ?? 0;
    const pending = input.pendingExercisesCount ?? 0;
    const announcements = input.unreadAnnouncementsCount ?? 0;
    const answers = input.unseenAnswersCount ?? 0;
    const progress = input.overallProgressPercent ?? 0;

    // ── Lógica de mensagem por prioridade ──
    let message = "";
    let urgency: "low" | "medium" | "high" = "low";

    if (answers > 0 && pending > 0) {
      urgency = "medium";
      message = `O professor respondeu ${answers} dúvida${answers !== 1 ? "s" : ""} suas. Você também tem ${pending} exercício${pending !== 1 ? "s" : ""} pendente${pending !== 1 ? "s" : ""}.`;
    } else if (answers > 0) {
      urgency = "low";
      message = `O professor respondeu ${answers} dúvida${answers !== 1 ? "s" : ""} suas. Confira as respostas! 👨‍🏫`;
    } else if (progress >= 80) {
      urgency = "low";
      message = `Você está arrasando! ${progress}% das trilhas concluídas. Continue assim! 🚀`;
    } else if (progress >= 40 && pending > 0) {
      urgency = "medium";
      message = `Você completou ${progress}% das trilhas. Ainda tem ${pending} exercício${pending !== 1 ? "s" : ""} para fechar a semana forte!`;
    } else if (progress > 0 && progress < 40) {
      urgency = "medium";
      message = `Sua semana está em ${progress}% de progresso. Que tal dedicar 30 minutos agora para avançar? 💪`;
    } else if (pending > 0) {
      urgency = "medium";
      message = `Você tem ${pending} exercício${pending !== 1 ? "s" : ""} pendente${pending !== 1 ? "s" : ""} para resolver. Vamos lá! 📝`;
    } else if (announcements > 0) {
      urgency = "low";
      message = `Você tem ${announcements} aviso${announcements !== 1 ? "s" : ""} novo${announcements !== 1 ? "s" : ""} do professor. Confira! 🔔`;
    } else {
      urgency = "low";
      message = "Bem-vindo ao seu portal de estudos. Bons estudos hoje! 📚";
    }

    // ── Chips de dados ──
    const chips: GreetingChip[] = [];
    if (subjects > 0) chips.push({ icon: "📖", value: subjects, label: "Disciplinas ativas" });
    if (progress > 0) chips.push({ icon: "✅", value: `${progress}%`, label: "Progresso nas trilhas" });
    if (pending > 0) chips.push({ icon: "📝", value: pending, label: "Exercícios pendentes", highlight: true });
    if (announcements > 0) chips.push({ icon: "🔔", value: announcements, label: "Avisos novos", highlight: true });
    if (answers > 0) chips.push({ icon: "💬", value: answers, label: "Respostas recebidas", highlight: false });

    return {
      greeting: `${greeting}, ${firstName}!`,
      emoji,
      message,
      urgency,
      chips,
      frase: getFraseDodia(),
    };
  }, [
    input.name,
    input.activeSubjectsCount,
    input.pendingExercisesCount,
    input.unreadAnnouncementsCount,
    input.unseenAnswersCount,
    input.overallProgressPercent,
  ]);
}
