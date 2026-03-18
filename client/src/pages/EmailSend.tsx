import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Send,
  Users,
  BookOpen,
  UserCheck,
  ArrowLeft,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings,
  FileText,
  GraduationCap,
  CalendarCheck,
  Megaphone,
  Star,
  ClipboardList,
  Eye,
} from "lucide-react";

// ==================== TEMPLATES DE E-MAIL ====================

interface EmailTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  category: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  description: string;
  variables: string[];
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "aviso-prova",
    name: "Aviso de Prova/Avaliação",
    icon: <ClipboardList className="w-5 h-5" />,
    color: "text-red-600 bg-red-50 border-red-200",
    category: "Avaliações",
    description: "Notifique os alunos sobre uma prova ou avaliação agendada",
    subject: "📝 Aviso de Avaliação - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Informamos que a avaliação da disciplina [DISCIPLINA] está agendada conforme detalhes abaixo:

📅 Data: [DATA]
🕐 Horário: [HORÁRIO]
📍 Local: [LOCAL/SALA]
📚 Conteúdo: [CONTEÚDO DA PROVA]

Orientações importantes:
- Chegue com pelo menos 15 minutos de antecedência
- Traga documento de identificação
- Material permitido: [MATERIAIS PERMITIDOS]

Em caso de dúvidas, entre em contato.

Bons estudos!

Atenciosamente,
[NOME DO PROFESSOR]
[DISCIPLINA]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📝 Aviso de Avaliação</h1>
    <p style="color: #fecaca; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Informamos que a avaliação da disciplina <strong>[DISCIPLINA]</strong> está agendada conforme detalhes abaixo:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fef2f2; border-radius: 8px;">
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;"><strong>📅 Data:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;">[DATA]</td></tr>
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;"><strong>🕐 Horário:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;">[HORÁRIO]</td></tr>
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;"><strong>📍 Local:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #fecaca;">[LOCAL/SALA]</td></tr>
      <tr><td style="padding: 12px 16px;"><strong>📚 Conteúdo:</strong></td><td style="padding: 12px 16px;">[CONTEÚDO DA PROVA]</td></tr>
    </table>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #92400e;">⚠️ Orientações importantes:</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e;">
        <li>Chegue com pelo menos 15 minutos de antecedência</li>
        <li>Traga documento de identificação</li>
        <li>Material permitido: [MATERIAIS PERMITIDOS]</li>
      </ul>
    </div>
    <p style="color: #374151; font-size: 15px;">Bons estudos!</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong><br>[DISCIPLINA]</p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "DATA", "HORÁRIO", "LOCAL/SALA", "CONTEÚDO DA PROVA", "MATERIAIS PERMITIDOS", "NOME DO PROFESSOR"],
  },
  {
    id: "lembrete-entrega",
    name: "Lembrete de Entrega",
    icon: <CalendarCheck className="w-5 h-5" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    category: "Atividades",
    description: "Lembre os alunos sobre prazos de entrega de trabalhos e atividades",
    subject: "⏰ Lembrete de Entrega - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Este é um lembrete sobre o prazo de entrega da atividade:

📋 Atividade: [NOME DA ATIVIDADE]
📚 Disciplina: [DISCIPLINA]
📅 Prazo final: [DATA DE ENTREGA]
🕐 Horário limite: [HORÁRIO LIMITE]

Forma de entrega: [FORMA DE ENTREGA]

Observações:
- [OBSERVAÇÕES ADICIONAIS]
- Trabalhos entregues após o prazo poderão sofrer penalização
- Em caso de dificuldades, entre em contato ANTES do prazo

Não deixe para a última hora!

Atenciosamente,
[NOME DO PROFESSOR]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Lembrete de Entrega</h1>
    <p style="color: #fde68a; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Este é um lembrete sobre o prazo de entrega da atividade:</p>
    <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="font-size: 18px; font-weight: 700; color: #92400e; margin: 0 0 8px;">📋 [NOME DA ATIVIDADE]</p>
      <p style="font-size: 28px; font-weight: 800; color: #dc2626; margin: 0;">📅 [DATA DE ENTREGA]</p>
      <p style="font-size: 14px; color: #b45309; margin: 8px 0 0;">Horário limite: [HORÁRIO LIMITE]</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Forma de entrega:</strong></td><td style="padding: 10px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">[FORMA DE ENTREGA]</td></tr>
    </table>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-weight: 600; color: #92400e;">💡 Observações:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px; color: #78350f;">
        <li>[OBSERVAÇÕES ADICIONAIS]</li>
        <li>Trabalhos entregues após o prazo poderão sofrer penalização</li>
        <li>Em caso de dificuldades, entre em contato ANTES do prazo</li>
      </ul>
    </div>
    <p style="color: #dc2626; font-weight: 600; font-size: 16px; text-align: center;">🚀 Não deixe para a última hora!</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong></p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "NOME DA ATIVIDADE", "DATA DE ENTREGA", "HORÁRIO LIMITE", "FORMA DE ENTREGA", "OBSERVAÇÕES ADICIONAIS", "NOME DO PROFESSOR"],
  },
  {
    id: "comunicado-geral",
    name: "Comunicado Geral",
    icon: <Megaphone className="w-5 h-5" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    category: "Comunicados",
    description: "Envie comunicados gerais para turmas ou todos os alunos",
    subject: "📢 Comunicado - [ASSUNTO]",
    bodyText: `Prezado(a) aluno(a),

Gostaríamos de informar sobre o seguinte comunicado:

[CONTEÚDO DO COMUNICADO]

Informações adicionais:
- [INFORMAÇÃO 1]
- [INFORMAÇÃO 2]

Em caso de dúvidas, estamos à disposição.

Atenciosamente,
[NOME DO PROFESSOR]
[DISCIPLINA/COORDENAÇÃO]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📢 Comunicado</h1>
    <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">[ASSUNTO]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Gostaríamos de informar sobre o seguinte comunicado:</p>
    <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #1e40af; font-size: 15px; line-height: 1.8; margin: 0;">[CONTEÚDO DO COMUNICADO]</p>
    </div>
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #374151;">ℹ️ Informações adicionais:</p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
        <li>[INFORMAÇÃO 1]</li>
        <li>[INFORMAÇÃO 2]</li>
      </ul>
    </div>
    <p style="color: #374151; font-size: 15px;">Em caso de dúvidas, estamos à disposição.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong><br>[DISCIPLINA/COORDENAÇÃO]</p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["ASSUNTO", "CONTEÚDO DO COMUNICADO", "INFORMAÇÃO 1", "INFORMAÇÃO 2", "NOME DO PROFESSOR", "DISCIPLINA/COORDENAÇÃO"],
  },
  {
    id: "boas-vindas",
    name: "Boas-vindas",
    icon: <Star className="w-5 h-5" />,
    color: "text-green-600 bg-green-50 border-green-200",
    category: "Institucional",
    description: "Dê as boas-vindas aos novos alunos da turma",
    subject: "🎓 Bem-vindo(a) à disciplina [DISCIPLINA]!",
    bodyText: `Prezado(a) aluno(a),

Seja bem-vindo(a) à disciplina [DISCIPLINA]!

Informações importantes:
📚 Disciplina: [DISCIPLINA]
👨‍🏫 Professor(a): [NOME DO PROFESSOR]
📅 Horário das aulas: [HORÁRIO DAS AULAS]
📍 Sala: [SALA]

Sobre a disciplina:
[DESCRIÇÃO DA DISCIPLINA]

Materiais necessários:
- [MATERIAL 1]
- [MATERIAL 2]

Estou à disposição para dúvidas.

Bom semestre!

Atenciosamente,
[NOME DO PROFESSOR]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎓 Bem-vindo(a)!</h1>
    <p style="color: #bbf7d0; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Seja bem-vindo(a) à disciplina <strong>[DISCIPLINA]</strong>!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f0fdf4; border-radius: 8px;">
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #bbf7d0;"><strong>👨‍🏫 Professor(a):</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #bbf7d0;">[NOME DO PROFESSOR]</td></tr>
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #bbf7d0;"><strong>📅 Horário:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #bbf7d0;">[HORÁRIO DAS AULAS]</td></tr>
      <tr><td style="padding: 12px 16px;"><strong>📍 Sala:</strong></td><td style="padding: 12px 16px;">[SALA]</td></tr>
    </table>
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #166534; line-height: 1.6;">[DESCRIÇÃO DA DISCIPLINA]</p>
    </div>
    <p style="color: #374151; font-size: 15px;">Bom semestre!</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong></p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "NOME DO PROFESSOR", "HORÁRIO DAS AULAS", "SALA", "DESCRIÇÃO DA DISCIPLINA", "MATERIAL 1", "MATERIAL 2"],
  },
  {
    id: "resultado-avaliacao",
    name: "Resultado de Avaliação",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    category: "Avaliações",
    description: "Informe os alunos sobre os resultados de uma avaliação",
    subject: "📊 Resultado da Avaliação - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Os resultados da avaliação de [DISCIPLINA] já estão disponíveis.

📋 Avaliação: [NOME DA AVALIAÇÃO]
📅 Data da prova: [DATA DA PROVA]
📊 Média da turma: [MÉDIA DA TURMA]

Os resultados individuais estão disponíveis no portal do aluno.

Período para revisão de prova: [PERÍODO DE REVISÃO]

Em caso de dúvidas sobre a correção, procure o professor durante o horário de atendimento.

Atenciosamente,
[NOME DO PROFESSOR]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #9333ea, #7e22ce); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Resultado da Avaliação</h1>
    <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Os resultados da avaliação de <strong>[DISCIPLINA]</strong> já estão disponíveis.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #faf5ff; border-radius: 8px;">
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;"><strong>📋 Avaliação:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;">[NOME DA AVALIAÇÃO]</td></tr>
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;"><strong>📅 Data:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;">[DATA DA PROVA]</td></tr>
      <tr><td style="padding: 12px 16px;"><strong>📊 Média:</strong></td><td style="padding: 12px 16px;">[MÉDIA DA TURMA]</td></tr>
    </table>
    <div style="background: #f3e8ff; border-left: 4px solid #9333ea; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #581c87;">📌 Período para revisão de prova: <strong>[PERÍODO DE REVISÃO]</strong></p>
    </div>
    <p style="color: #374151; font-size: 15px;">Os resultados individuais estão disponíveis no portal do aluno.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong></p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "NOME DA AVALIAÇÃO", "DATA DA PROVA", "MÉDIA DA TURMA", "PERÍODO DE REVISÃO", "NOME DO PROFESSOR"],
  },
  {
    id: "cancelamento-aula",
    name: "Cancelamento de Aula",
    icon: <XCircle className="w-5 h-5" />,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    category: "Comunicados",
    description: "Informe os alunos sobre o cancelamento ou reposição de aula",
    subject: "🚫 Cancelamento de Aula - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Informamos que a aula de [DISCIPLINA] do dia [DATA] está cancelada.

Motivo: [MOTIVO DO CANCELAMENTO]

📅 Reposição prevista: [DATA DA REPOSIÇÃO]
🕐 Horário: [HORÁRIO DA REPOSIÇÃO]
📍 Local: [LOCAL DA REPOSIÇÃO]

Pedimos desculpas pelo inconveniente.

Atenciosamente,
[NOME DO PROFESSOR]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #4b5563, #374151); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚫 Cancelamento de Aula</h1>
    <p style="color: #d1d5db; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA] - [DATA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="font-size: 16px; color: #991b1b; margin: 0;">A aula de <strong>[DISCIPLINA]</strong> do dia <strong>[DATA]</strong> está <span style="color: #dc2626; font-weight: 800;">CANCELADA</span></p>
      <p style="font-size: 14px; color: #7f1d1d; margin: 8px 0 0;">Motivo: [MOTIVO DO CANCELAMENTO]</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f0fdf4; border-radius: 8px;">
      <tr><td colspan="2" style="padding: 12px 16px; border-bottom: 1px solid #bbf7d0; font-weight: 600; color: #166534;">📅 Informações da Reposição:</td></tr>
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>Data:</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[DATA DA REPOSIÇÃO]</td></tr>
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>Horário:</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[HORÁRIO DA REPOSIÇÃO]</td></tr>
      <tr><td style="padding: 10px 16px;"><strong>Local:</strong></td><td style="padding: 10px 16px;">[LOCAL DA REPOSIÇÃO]</td></tr>
    </table>
    <p style="color: #374151; font-size: 15px;">Pedimos desculpas pelo inconveniente.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong></p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "DATA", "MOTIVO DO CANCELAMENTO", "DATA DA REPOSIÇÃO", "HORÁRIO DA REPOSIÇÃO", "LOCAL DA REPOSIÇÃO", "NOME DO PROFESSOR"],
  },
];

type RecipientType = "class" | "subject" | "all" | "manual";

export default function EmailSend() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Estado
  const [recipientType, setRecipientType] = useState<RecipientType>("class");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [manualRecipients, setManualRecipients] = useState([{ name: "", email: "" }]);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [useHtml, setUseHtml] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Queries
  const { data: emailConfig } = trpc.email.getConfig.useQuery();
  const { data: groups } = trpc.email.getRecipientGroups.useQuery();

  const { data: classStudents } = trpc.email.getStudentsByClass.useQuery(
    { classId: selectedClassId! },
    { enabled: recipientType === "class" && !!selectedClassId }
  );

  const { data: subjectStudents } = trpc.email.getStudentsBySubject.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: recipientType === "subject" && !!selectedSubjectId }
  );

  const { data: allStudents } = trpc.email.getAllStudents.useQuery(undefined, {
    enabled: recipientType === "all",
  });

  const campaignInput = useMemo(() => ({ limit: 20, offset: 0 }), []);
  const { data: campaigns, refetch: refetchCampaigns } = trpc.email.getCampaigns.useQuery(campaignInput);

  // Mutations
  const sendEmailMutation = trpc.email.sendEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`E-mail enviado para ${data.sentCount} destinatário(s)!`);
      setSubject("");
      setBodyText("");
      setBodyHtml("");
      setUseHtml(false);
      setActiveTemplate(null);
      refetchCampaigns();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteCampaignMutation = trpc.email.deleteCampaign.useMutation({
    onSuccess: () => {
      toast.success("Removido do histórico");
      refetchCampaigns();
    },
  });

  // Normalizar alunos
  const normalizeStudents = (list: any[] | undefined | null) =>
    (list || []).map((s) => ({
      studentId: s.studentId ?? s.id,
      name: s.name,
      registration: s.registration,
      email: s.email ?? null,
    }));

  const currentStudents =
    recipientType === "class"
      ? normalizeStudents(classStudents)
      : recipientType === "subject"
      ? normalizeStudents(subjectStudents)
      : recipientType === "all"
      ? normalizeStudents(allStudents)
      : [];

  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [recipientType, selectedClassId, selectedSubjectId]);

  useEffect(() => {
    if (currentStudents && currentStudents.length > 0) {
      setSelectedStudentIds(new Set(currentStudents.map((s) => s.studentId)));
    }
  }, [classStudents, subjectStudents, allStudents]);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!currentStudents) return;
    if (selectedStudentIds.size === currentStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(currentStudents.map((s) => s.studentId)));
    }
  };

  const buildRecipients = (): { name: string; email: string }[] => {
    if (recipientType === "manual") {
      return manualRecipients.filter((r) => r.name && r.email);
    }
    if (!currentStudents) return [];
    const selected = currentStudents.filter((s) => selectedStudentIds.has(s.studentId));
    const withEmail = selected.filter((s) => s.email);
    const withoutEmail = selected.filter((s) => !s.email);
    if (withoutEmail.length > 0) {
      toast.warning(
        `${withoutEmail.length} aluno(s) sem e-mail cadastrado serão ignorados: ${withoutEmail.map((s) => s.name).join(", ")}`
      );
    }
    return withEmail.map((s) => ({
      name: s.name,
      email: s.email!,
    }));
  };

  // Aplicar template
  const applyTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBodyText(template.bodyText);
    setBodyHtml(template.bodyHtml);
    setUseHtml(true);
    setActiveTemplate(template.id);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" aplicado! Edite os campos entre [colchetes] com suas informações.`);
  };

  const handleSend = () => {
    if (!emailConfig?.isActive) {
      toast.error("Configure o SMTP primeiro em Administração > Configuração de E-mail");
      return;
    }
    if (!subject.trim()) return toast.error("Informe o assunto do e-mail");
    if (!bodyText.trim() && !bodyHtml.trim()) return toast.error("Informe o corpo do e-mail");

    const recipients = buildRecipients();
    if (recipients.length === 0) {
      toast.error("Nenhum destinatário selecionado");
      return;
    }

    const htmlContent = useHtml
      ? bodyHtml
      : `<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${bodyText.replace(/\n/g, "<br>")}
          <hr style="border: 1px solid #e5e7eb; margin-top: 30px;">
          <p style="color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</p>
        </div>`;

    const groupName =
      recipientType === "class" && selectedClassId
        ? groups?.classes.find((c) => c.id === selectedClassId)?.name
        : recipientType === "subject" && selectedSubjectId
        ? groups?.subjects.find((s) => s.id === selectedSubjectId)?.name
        : recipientType === "all"
        ? "Todos os alunos"
        : "Manual";

    sendEmailMutation.mutate({
      subject,
      bodyHtml: htmlContent,
      bodyText,
      recipientType,
      recipientGroupId: selectedClassId || selectedSubjectId || undefined,
      recipientGroupName: groupName,
      recipients,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "partial":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      completed: "Enviado",
      failed: "Falhou",
      partial: "Parcial",
      sending: "Enviando",
      pending: "Pendente",
    };
    return map[status] || status;
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                  <Send className="w-8 h-8 text-primary" />
                  Enviar E-mail
                </h1>
                <p className="text-muted-foreground">Envie mensagens para grupos de alunos</p>
              </div>
              <div className="flex items-center gap-2">
                {!emailConfig ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/admin/email-config")}
                    className="text-amber-600 border-amber-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar SMTP
                  </Button>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    SMTP configurado
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Aviso se não tem SMTP */}
          {!emailConfig && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Configuração SMTP necessária</p>
                  <p>
                    Para enviar e-mails, primeiro configure o servidor SMTP em{" "}
                    <button
                      className="underline font-medium"
                      onClick={() => setLocation("/admin/email-config")}
                    >
                      Administração &gt; Configuração de E-mail
                    </button>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ==================== SEÇÃO DE TEMPLATES ==================== */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Templates de E-mail</h2>
                    <p className="text-sm text-gray-500">Use um modelo pré-definido para agilizar o envio</p>
                  </div>
                </div>
                <Button
                  variant={showTemplates ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {showTemplates ? "Ocultar Templates" : "Ver Templates"}
                  {showTemplates ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </Button>
              </div>

              {showTemplates && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {EMAIL_TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                          activeTemplate === template.id
                            ? "ring-2 ring-blue-500 border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${template.color}`}>
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                            <Badge variant="outline" className="mt-2 text-[10px]">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyTemplate(template);
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Usar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {activeTemplate && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Template <strong>{EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.name}</strong> aplicado.
                          Edite os campos entre <code className="bg-blue-100 px-1 rounded">[colchetes]</code> abaixo.
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 text-xs"
                        onClick={() => {
                          setSubject("");
                          setBodyText("");
                          setBodyHtml("");
                          setUseHtml(false);
                          setActiveTemplate(null);
                        }}
                      >
                        Limpar template
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ==================== PREVIEW DIALOG ==================== */}
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview: {previewTemplate?.name}
                </DialogTitle>
                <DialogDescription>
                  Visualize como o e-mail será exibido para os destinatários
                </DialogDescription>
              </DialogHeader>
              {previewTemplate && (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Assunto:</p>
                    <p className="font-medium text-sm">{previewTemplate.subject}</p>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div
                      className="bg-white"
                      dangerouslySetInnerHTML={{ __html: previewTemplate.bodyHtml }}
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">
                      Campos para personalizar:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewTemplate.variables.map((v) => (
                        <code
                          key={v}
                          className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded"
                        >
                          [{v}]
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        applyTemplate(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Usar este template
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* ==================== ÁREA PRINCIPAL ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Coluna esquerda: Destinatários */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Destinatários</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Enviar para</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "class", label: "Turma", icon: Users },
                          { value: "subject", label: "Disciplina", icon: BookOpen },
                          { value: "all", label: "Todos", icon: UserCheck },
                          { value: "manual", label: "Manual", icon: Mail },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setRecipientType(value as RecipientType)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                              recipientType === value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300 text-gray-600"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {recipientType === "class" && (
                      <div className="space-y-1.5">
                        <Label>Selecionar Turma</Label>
                        <Select
                          value={selectedClassId?.toString() || ""}
                          onValueChange={(v) => setSelectedClassId(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha uma turma..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups?.classes.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} {c.code && `(${c.code})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {recipientType === "subject" && (
                      <div className="space-y-1.5">
                        <Label>Selecionar Disciplina</Label>
                        <Select
                          value={selectedSubjectId?.toString() || ""}
                          onValueChange={(v) => setSelectedSubjectId(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha uma disciplina..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groups?.subjects.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name} {s.code && `(${s.code})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(recipientType === "class" || recipientType === "subject" || recipientType === "all") &&
                      currentStudents && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>
                              Alunos ({selectedStudentIds.size}/{currentStudents.length})
                            </Label>
                            <button
                              className="text-xs text-blue-600 hover:underline"
                              onClick={toggleAll}
                            >
                              {selectedStudentIds.size === currentStudents.length
                                ? "Desmarcar todos"
                                : "Selecionar todos"}
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                            {currentStudents.length === 0 ? (
                              <p className="text-sm text-gray-500 p-3 text-center">
                                Nenhum aluno encontrado
                              </p>
                            ) : (
                              currentStudents.map((student) => (
                                <label
                                  key={student.studentId}
                                  className={`flex items-center gap-2 p-2 cursor-pointer ${
                                    student.email ? "hover:bg-gray-50" : "opacity-50 bg-gray-50"
                                  }`}
                                  title={student.email ? `E-mail: ${student.email}` : "Aluno sem e-mail cadastrado"}
                                >
                                  <Checkbox
                                    checked={selectedStudentIds.has(student.studentId)}
                                    onCheckedChange={() => toggleStudent(student.studentId)}
                                    disabled={!student.email}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{student.name}</p>
                                    <p className="text-xs text-gray-400">{student.registration}</p>
                                  </div>
                                  {student.email ? (
                                    <span className="text-xs text-green-600 shrink-0" title={student.email}>✓ e-mail</span>
                                  ) : (
                                    <span className="text-xs text-red-400 shrink-0">sem e-mail</span>
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                          <p className="text-xs text-amber-600">
                            O e-mail será enviado para o endereço cadastrado de cada aluno.
                          </p>
                        </div>
                      )}

                    {recipientType === "manual" && (
                      <div className="space-y-2">
                        <Label>Destinatários</Label>
                        {manualRecipients.map((r, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              placeholder="Nome"
                              value={r.name}
                              onChange={(e) => {
                                const next = [...manualRecipients];
                                next[i].name = e.target.value;
                                setManualRecipients(next);
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="E-mail"
                              type="email"
                              value={r.email}
                              onChange={(e) => {
                                const next = [...manualRecipients];
                                next[i].email = e.target.value;
                                setManualRecipients(next);
                              }}
                              className="flex-1"
                            />
                            {manualRecipients.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setManualRecipients(manualRecipients.filter((_, j) => j !== i))
                                }
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setManualRecipients([...manualRecipients, { name: "", email: "" }])
                          }
                        >
                          + Adicionar destinatário
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita: Conteúdo do e-mail */}
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Conteúdo do E-mail</h2>
                    {activeTemplate && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] ml-2">
                        Template: {EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Compose a mensagem que será enviada aos destinatários</p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        placeholder="ex: Aviso importante sobre a próxima aula"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <Checkbox
                        id="useHtml"
                        checked={useHtml}
                        onCheckedChange={(v) => setUseHtml(!!v)}
                      />
                      <Label htmlFor="useHtml" className="cursor-pointer text-sm">
                        Usar HTML personalizado (avançado)
                      </Label>
                    </div>

                    {!useHtml ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="bodyText">Mensagem</Label>
                        <Textarea
                          id="bodyText"
                          placeholder="Digite aqui o conteúdo do e-mail..."
                          value={bodyText}
                          onChange={(e) => setBodyText(e.target.value)}
                          rows={12}
                          className="resize-none"
                        />
                        <p className="text-xs text-gray-400">
                          O texto será formatado automaticamente como e-mail HTML.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="bodyHtml">HTML do E-mail</Label>
                        <Textarea
                          id="bodyHtml"
                          placeholder="<div>Seu HTML aqui...</div>"
                          value={bodyHtml}
                          onChange={(e) => setBodyHtml(e.target.value)}
                          rows={12}
                          className="resize-none font-mono text-xs"
                        />
                      </div>
                    )}

                    {/* Resumo e botão de envio */}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{buildRecipients().length}</span> destinatário(s)
                        selecionado(s)
                      </div>
                      <Button
                        size="lg"
                        onClick={handleSend}
                        disabled={sendEmailMutation.isPending || !emailConfig}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendEmailMutation.isPending ? "Enviando..." : "Enviar E-mail"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórico de envios */}
          <div className="mt-6">
            <button
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="w-4 h-4" />
              Histórico de Envios
              {showHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showHistory && (
              <Card>
                <CardContent className="p-0">
                  {!campaigns || campaigns.length === 0 ? (
                    <div className="p-8 text-center">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Nenhum e-mail enviado ainda</p>
                      <p className="text-sm text-gray-400 mt-1">O histórico de envios aparecerá aqui</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Destinatários</TableHead>
                          <TableHead>Enviados</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getStatusIcon(c.status)}
                                <span className="text-xs">{getStatusLabel(c.status)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">
                              {c.subject}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {c.recipientGroupName || c.recipientType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="text-green-600">{c.sentCount}</span>
                              {c.failedCount > 0 && (
                                <span className="text-red-500 ml-1">/ {c.failedCount} falha</span>
                              )}
                              <span className="text-gray-400"> / {c.totalRecipients}</span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {new Date(c.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteCampaignMutation.mutate({ campaignId: c.id })}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
