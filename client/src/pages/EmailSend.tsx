import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    name: "Boas-vindas à Disciplina",
    icon: <Star className="w-5 h-5" />,
    color: "text-green-600 bg-green-50 border-green-200",
    category: "Início",
    description: "Dê boas-vindas aos alunos no início do semestre ou disciplina",
    subject: "🎓 Bem-vindo(a) à disciplina [DISCIPLINA]!",
    bodyText: `Prezado(a) aluno(a),

Seja bem-vindo(a) à disciplina [DISCIPLINA]!

É com grande satisfação que inicio este semestre letivo com vocês. Seguem algumas informações importantes:

📚 Disciplina: [DISCIPLINA]
👨‍🏫 Professor(a): [NOME DO PROFESSOR]
📧 E-mail: [E-MAIL DO PROFESSOR]
🕐 Horário das aulas: [HORÁRIO DAS AULAS]
📍 Sala: [SALA]

Ementa resumida:
[EMENTA RESUMIDA]

Critérios de avaliação:
- [CRITÉRIO 1]
- [CRITÉRIO 2]
- [CRITÉRIO 3]

Material necessário:
- [MATERIAL 1]
- [MATERIAL 2]

Estou à disposição para dúvidas e sugestões. Vamos ter um excelente semestre!

Atenciosamente,
[NOME DO PROFESSOR]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎓 Bem-vindo(a)!</h1>
    <p style="color: #bbf7d0; margin: 8px 0 0; font-size: 16px; font-weight: 600;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">É com grande satisfação que inicio este semestre letivo com vocês!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f0fdf4; border-radius: 8px;">
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>📚 Disciplina:</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[DISCIPLINA]</td></tr>
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>👨‍🏫 Professor(a):</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[NOME DO PROFESSOR]</td></tr>
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>📧 E-mail:</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[E-MAIL DO PROFESSOR]</td></tr>
      <tr><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;"><strong>🕐 Horário:</strong></td><td style="padding: 10px 16px; border-bottom: 1px solid #bbf7d0;">[HORÁRIO DAS AULAS]</td></tr>
      <tr><td style="padding: 10px 16px;"><strong>📍 Sala:</strong></td><td style="padding: 10px 16px;">[SALA]</td></tr>
    </table>
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #166534;">📖 Ementa resumida:</p>
      <p style="margin: 0; color: #166534;">[EMENTA RESUMIDA]</p>
    </div>
    <div style="display: flex; gap: 16px; margin: 20px 0;">
      <div style="flex: 1; background: #f9fafb; padding: 16px; border-radius: 8px;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #374151;">📊 Critérios de avaliação:</p>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
          <li>[CRITÉRIO 1]</li>
          <li>[CRITÉRIO 2]</li>
          <li>[CRITÉRIO 3]</li>
        </ul>
      </div>
    </div>
    <p style="color: #374151; font-size: 15px;">Estou à disposição para dúvidas e sugestões. Vamos ter um excelente semestre! 🚀</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong></p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "NOME DO PROFESSOR", "E-MAIL DO PROFESSOR", "HORÁRIO DAS AULAS", "SALA", "EMENTA RESUMIDA", "CRITÉRIO 1", "CRITÉRIO 2", "CRITÉRIO 3", "MATERIAL 1", "MATERIAL 2"],
  },
  {
    id: "resultado-avaliacao",
    name: "Resultado de Avaliação",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    category: "Avaliações",
    description: "Informe os alunos sobre os resultados de provas e avaliações",
    subject: "📊 Resultado da Avaliação - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Os resultados da avaliação da disciplina [DISCIPLINA] já estão disponíveis.

📋 Avaliação: [NOME DA AVALIAÇÃO]
📅 Data da prova: [DATA DA PROVA]
📊 Média da turma: [MÉDIA DA TURMA]

Você pode consultar sua nota individual no portal do aluno do FlowEdu.

Período para revisão de prova:
📅 De [DATA INÍCIO REVISÃO] até [DATA FIM REVISÃO]
📍 Local: [LOCAL DA REVISÃO]

Observações:
- [OBSERVAÇÕES]

Em caso de dúvidas sobre a correção, agende um horário para revisão.

Atenciosamente,
[NOME DO PROFESSOR]
[DISCIPLINA]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #9333ea, #7e22ce); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Resultado da Avaliação</h1>
    <p style="color: #e9d5ff; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Os resultados da avaliação da disciplina <strong>[DISCIPLINA]</strong> já estão disponíveis.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #faf5ff; border-radius: 8px;">
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;"><strong>📋 Avaliação:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;">[NOME DA AVALIAÇÃO]</td></tr>
      <tr><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;"><strong>📅 Data:</strong></td><td style="padding: 12px 16px; border-bottom: 1px solid #e9d5ff;">[DATA DA PROVA]</td></tr>
      <tr><td style="padding: 12px 16px;"><strong>📊 Média da turma:</strong></td><td style="padding: 12px 16px; font-weight: 700; font-size: 18px; color: #7e22ce;">[MÉDIA DA TURMA]</td></tr>
    </table>
    <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="font-size: 16px; color: #166534; margin: 0;">✅ Consulte sua nota individual no <strong>Portal do Aluno</strong> do FlowEdu</p>
    </div>
    <div style="background: #faf5ff; border-left: 4px solid #9333ea; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #581c87;">📝 Período para revisão de prova:</p>
      <p style="margin: 0; color: #6b21a8;">De <strong>[DATA INÍCIO REVISÃO]</strong> até <strong>[DATA FIM REVISÃO]</strong></p>
      <p style="margin: 4px 0 0; color: #6b21a8;">📍 Local: [LOCAL DA REVISÃO]</p>
    </div>
    <p style="color: #374151; font-size: 15px;">Em caso de dúvidas sobre a correção, agende um horário para revisão.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong><br>[DISCIPLINA]</p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "NOME DA AVALIAÇÃO", "DATA DA PROVA", "MÉDIA DA TURMA", "DATA INÍCIO REVISÃO", "DATA FIM REVISÃO", "LOCAL DA REVISÃO", "OBSERVAÇÕES", "NOME DO PROFESSOR"],
  },
  {
    id: "cancelamento-aula",
    name: "Cancelamento/Alteração de Aula",
    icon: <AlertCircle className="w-5 h-5" />,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    category: "Comunicados",
    description: "Informe sobre cancelamento ou alteração de aulas",
    subject: "⚠️ Alteração de Aula - [DISCIPLINA]",
    bodyText: `Prezado(a) aluno(a),

Informamos que houve uma alteração na aula da disciplina [DISCIPLINA]:

📅 Data original: [DATA ORIGINAL]
🔄 Situação: [CANCELADA / REAGENDADA / ALTERAÇÃO DE SALA]

[SE REAGENDADA]
📅 Nova data: [NOVA DATA]
🕐 Novo horário: [NOVO HORÁRIO]
📍 Novo local: [NOVO LOCAL]

Motivo: [MOTIVO DA ALTERAÇÃO]

Pedimos desculpas pelo inconveniente e contamos com a compreensão de todos.

Atenciosamente,
[NOME DO PROFESSOR]
[DISCIPLINA]`,
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Alteração de Aula</h1>
    <p style="color: #fed7aa; margin: 8px 0 0; font-size: 14px;">[DISCIPLINA]</p>
  </div>
  <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Prezado(a) aluno(a),</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Informamos que houve uma alteração na aula da disciplina <strong>[DISCIPLINA]</strong>:</p>
    <div style="background: #fff7ed; border: 2px solid #ea580c; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0;"><strong>📅 Data original:</strong></td><td style="padding: 8px 0; text-decoration: line-through; color: #dc2626;">[DATA ORIGINAL]</td></tr>
        <tr><td style="padding: 8px 0;"><strong>🔄 Situação:</strong></td><td style="padding: 8px 0; font-weight: 700; color: #ea580c;">[CANCELADA / REAGENDADA / ALTERAÇÃO DE SALA]</td></tr>
      </table>
    </div>
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #166534;">📅 Novas informações:</p>
      <p style="margin: 0; color: #166534;">Nova data: <strong>[NOVA DATA]</strong></p>
      <p style="margin: 4px 0 0; color: #166534;">Novo horário: <strong>[NOVO HORÁRIO]</strong></p>
      <p style="margin: 4px 0 0; color: #166534;">Novo local: <strong>[NOVO LOCAL]</strong></p>
    </div>
    <p style="color: #6b7280; font-size: 14px;"><strong>Motivo:</strong> [MOTIVO DA ALTERAÇÃO]</p>
    <p style="color: #374151; font-size: 15px;">Pedimos desculpas pelo inconveniente e contamos com a compreensão de todos.</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Atenciosamente,<br><strong>[NOME DO PROFESSOR]</strong><br>[DISCIPLINA]</p>
  </div>
  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">Enviado via FlowEdu</div>
</div>`,
    variables: ["DISCIPLINA", "DATA ORIGINAL", "CANCELADA / REAGENDADA / ALTERAÇÃO DE SALA", "NOVA DATA", "NOVO HORÁRIO", "NOVO LOCAL", "MOTIVO DA ALTERAÇÃO", "NOME DO PROFESSOR"],
  },
];

// ==================== COMPONENTE PRINCIPAL ====================

type RecipientType = "class" | "subject" | "manual" | "all";

interface ManualRecipient {
  name: string;
  email: string;
}

export default function EmailSend() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Templates
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Destinatários
  const [recipientType, setRecipientType] = useState<RecipientType>("class");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [manualRecipients, setManualRecipients] = useState<ManualRecipient[]>([
    { name: "", email: "" },
  ]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

  // Conteúdo do e-mail
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [useHtml, setUseHtml] = useState(false);
  const [bodyHtml, setBodyHtml] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // UI
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  // Queries
  const { data: emailConfig } = trpc.email.getConfig.useQuery();
  const { data: groups } = trpc.email.getRecipientGroups.useQuery();
  const { data: classStudents } = trpc.email.getStudentsByClass.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId && recipientType === "class" }
  );
  const { data: subjectStudents } = trpc.email.getStudentsBySubject.useQuery(
    { subjectId: selectedSubjectId! },
    { enabled: !!selectedSubjectId && recipientType === "subject" }
  );
  const { data: allStudents } = trpc.email.getAllStudents.useQuery(
    undefined,
    { enabled: recipientType === "all" }
  );
  const { data: campaigns, refetch: refetchCampaigns } = trpc.email.getCampaigns.useQuery(
    { limit: 20, offset: historyPage * 20 },
    { enabled: showHistory }
  );

  // Mutations
  const sendEmailMutation = trpc.email.sendEmail.useMutation({
    onSuccess: (data) => {
      if (data.status === "completed") {
        toast.success(`E-mail enviado para ${data.sentCount} destinatário(s)!`);
      } else if (data.status === "partial") {
        toast.warning(`Enviado para ${data.sentCount} de ${data.totalRecipients}. ${data.failedCount} falhou(aram).`);
      } else {
        toast.error(`Falha ao enviar. Verifique a configuração SMTP.`);
      }
      setSubject("");
      setBodyText("");
      setBodyHtml("");
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
    return currentStudents
      .filter((s) => selectedStudentIds.has(s.studentId))
      .map((s) => ({
        name: s.name,
        email: s.registration + "@aluno.edu.br",
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <PageWrapper>
        <div className="max-w-5xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Enviar E-mail</h1>
                <p className="text-sm text-gray-500">Envie mensagens para grupos de alunos</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
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

          {/* Aviso se não tem SMTP */}
          {!emailConfig && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
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
            </div>
          )}

          {/* ==================== SEÇÃO DE TEMPLATES ==================== */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <div>
                    <CardTitle className="text-base">Templates de E-mail</CardTitle>
                    <CardDescription className="text-xs">
                      Use um modelo pré-definido para agilizar o envio
                    </CardDescription>
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
            </CardHeader>
            {showTemplates && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EMAIL_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                        activeTemplate === template.id
                          ? "ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${template.color}`}>
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
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
                          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
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
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-indigo-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Template <strong>{EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.name}</strong> aplicado.
                        Edite os campos entre <code className="bg-indigo-100 px-1 rounded">[colchetes]</code> abaixo.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-indigo-600 text-xs"
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
              </CardContent>
            )}
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
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
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
                      className="bg-indigo-600 hover:bg-indigo-700"
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
          <div className="grid grid-cols-5 gap-6">
            {/* Coluna esquerda: Destinatários */}
            <div className="col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Destinatários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
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
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <Checkbox
                                  checked={selectedStudentIds.has(student.studentId)}
                                  onCheckedChange={() => toggleStudent(student.studentId)}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{student.name}</p>
                                  <p className="text-xs text-gray-400">{student.registration}</p>
                                </div>
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
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita: Conteúdo do e-mail */}
            <div className="col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Conteúdo do E-mail
                    {activeTemplate && (
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">
                        Template: {EMAIL_TEMPLATES.find((t) => t.id === activeTemplate)?.name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      placeholder="ex: Aviso importante sobre a próxima aula"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                      onClick={handleSend}
                      disabled={sendEmailMutation.isPending || !emailConfig}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendEmailMutation.isPending ? "Enviando..." : "Enviar E-mail"}
                    </Button>
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
                    <div className="p-6 text-center text-gray-500 text-sm">
                      Nenhum e-mail enviado ainda
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
    </div>
  );
}
