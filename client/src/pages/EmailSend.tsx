import { useState, useEffect } from "react";
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
} from "lucide-react";

type RecipientType = "class" | "subject" | "manual" | "all";

interface ManualRecipient {
  name: string;
  email: string;
}

export default function EmailSend() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  // Normalizar alunos para ter sempre campo 'studentId'
  const normalizeStudents = (list: any[] | undefined | null) =>
    (list || []).map((s) => ({
      studentId: s.studentId ?? s.id,
      name: s.name,
      registration: s.registration,
    }));

  // Determinar lista de alunos atual
  const currentStudents =
    recipientType === "class"
      ? normalizeStudents(classStudents)
      : recipientType === "subject"
      ? normalizeStudents(subjectStudents)
      : recipientType === "all"
      ? normalizeStudents(allStudents)
      : [];

  // Quando muda o tipo de destinatário, resetar seleção
  useEffect(() => {
    setSelectedStudentIds(new Set());
  }, [recipientType, selectedClassId, selectedSubjectId]);

  // Quando carrega lista de alunos, selecionar todos por padrão
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

  // Construir lista final de destinatários
  const buildRecipients = (): { name: string; email: string }[] => {
    if (recipientType === "manual") {
      return manualRecipients.filter((r) => r.name && r.email);
    }
    if (!currentStudents) return [];
    return currentStudents
      .filter((s) => selectedStudentIds.has(s.studentId))
      .map((s) => ({
        name: s.name,
        email: s.registration + "@aluno.edu.br", // Placeholder: usar e-mail real quando disponível
      }));
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
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Send className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Enviar E-mail</h1>
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
                  {/* Tipo de destinatário */}
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

                  {/* Seletor de turma */}
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

                  {/* Seletor de disciplina */}
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

                  {/* Lista de alunos para seleção */}
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
                          ⚠️ O e-mail será enviado para o endereço cadastrado de cada aluno.
                          Certifique-se de que os alunos têm e-mail cadastrado.
                        </p>
                      </div>
                    )}

                  {/* Destinatários manuais */}
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
                        rows={10}
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
                        rows={10}
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
