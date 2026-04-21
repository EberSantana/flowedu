import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Clock, CheckCircle, Star, AlertCircle, Download, X, ClipboardList, Calendar } from "lucide-react";
import StudentLayout from "@/components/StudentLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Activity = {
  id: number;
  title: string;
  description: string | null;
  subjectName: string | null;
  className: string | null;
  dueDate: string | null;
  maxScore: number;
  status: "draft" | "published" | "closed";
  mySubmission: {
    id: number;
    fileUrl: string;
    fileName: string;
    fileMimeType: string;
    fileSizeBytes: number;
    comment: string | null;
    status: "submitted" | "graded" | "returned";
    score: number | null;
    feedback: string | null;
    submittedAt: string;
  } | null;
};

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "Word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/vnd.ms-powerpoint": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
};

const MAX_SIZE = 16 * 1024 * 1024; // 16MB

export default function StudentActivitiesPage() {
  const { student } = useStudentAuth();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bimestreFilter, setBimestreFilter] = useState<string>("all");
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: activities = [], isLoading } = trpc.activities.listForStudent.useQuery();

  const submitMutation = trpc.activities.getUploadUrl.useMutation({
    onSuccess: () => {
      toast.success("Atividade enviada com sucesso!");
      utils.activities.listForStudent.invalidate();
      setShowSubmit(false);
      setSelectedFile(null);
      setComment("");
      setSelectedActivity(null);
      setUploading(false);
    },
    onError: (e: any) => {
      setUploading(false);
      toast.error("Erro ao enviar: " + e.message);
    },
  });

  async function handleSubmit() {
    if (!selectedFile || !selectedActivity) return;
    if (!ALLOWED_TYPES[selectedFile.type]) {
      return toast.error("Tipo de arquivo não permitido. Use PDF, Word ou PowerPoint.");
    }
    if (selectedFile.size > MAX_SIZE) {
      return toast.error("Arquivo muito grande. Máximo 16MB.");
    }

    setUploading(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      submitMutation.mutate({
        activityId: selectedActivity.id,
        fileBase64: base64,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSizeBytes: selectedFile.size,
        comment: comment || undefined,
      });
    } catch {
      setUploading(false);
      toast.error("Erro ao processar arquivo.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES[file.type]) {
      toast.error("Tipo de arquivo não permitido. Use PDF, Word ou PowerPoint.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo 16MB.");
      return;
    }
    setSelectedFile(file);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function isPastDue(dueDate: string | null) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  function formatDate(date: string | Date | null) {
    if (!date) return "Sem prazo";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  const canSubmit = (activity: Activity) =>
    activity.status === "published" &&
    !isPastDue(activity.dueDate) &&
    activity.mySubmission?.status !== "graded";

  const getStatusInfo = (activity: Activity) => {
    if (activity.mySubmission?.status === "graded") {
      return { icon: CheckCircle, label: `Avaliado - ${activity.mySubmission.score}/${activity.maxScore}`, color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    }
    if (activity.mySubmission?.status === "submitted") {
      return { icon: Clock, label: "Enviado - Aguardando avaliação", color: "bg-blue-100 text-blue-700 border-blue-200" };
    }
    if (activity.status === "closed" || isPastDue(activity.dueDate)) {
      return { icon: AlertCircle, label: "Prazo encerrado", color: "bg-red-100 text-red-700 border-red-200" };
    }
    return { icon: Clock, label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" };
  };

  // Contadores
  const pendingCount = (activities as Activity[]).filter(a => !a.mySubmission && a.status === "published" && !isPastDue(a.dueDate)).length;
  const submittedCount = (activities as Activity[]).filter(a => a.mySubmission?.status === "submitted").length;
  const gradedCount = (activities as Activity[]).filter(a => a.mySubmission?.status === "graded").length;

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header gradiente */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Minhas Atividades</h1>
                <p className="text-primary-foreground/80 mt-1 text-sm">Visualize e entregue suas atividades</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto py-6 px-4">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                  <p className="text-sm text-amber-600">Pendentes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{submittedCount}</p>
                  <p className="text-sm text-blue-600">Enviadas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{gradedCount}</p>
                  <p className="text-sm text-emerald-600">Avaliadas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtro de Bimestre */}
          <div className="flex items-center gap-2 mb-4">
            <Select value={bimestreFilter} onValueChange={setBimestreFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Bimestres</SelectItem>
                <SelectItem value="1">1º Bimestre</SelectItem>
                <SelectItem value="2">2º Bimestre</SelectItem>
                <SelectItem value="3">3º Bimestre</SelectItem>
                <SelectItem value="4">4º Bimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities List */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white shadow-md animate-pulse">
                  <CardHeader className="pb-3"><div className="h-6 bg-gray-200 rounded w-3/4" /><div className="h-4 bg-gray-100 rounded w-1/2 mt-2" /></CardHeader>
                  <CardContent><div className="h-20 bg-gray-100 rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : (activities as Activity[]).length === 0 ? (
            <Card className="bg-white border-dashed border-2 border-gray-300">
              <CardContent className="py-16 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma atividade disponível</p>
                <p className="text-gray-400 text-sm mt-1">Seu professor ainda não publicou atividades</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {(activities as Activity[]).filter((a: any) => bimestreFilter === "all" || String((a as any).bimestre || 1) === bimestreFilter).map((activity) => {
                const statusInfo = getStatusInfo(activity);
                const StatusIcon = statusInfo.icon;
                const overdue = isPastDue(activity.dueDate);

                return (
                  <Card key={activity.id} className="bg-white shadow-md hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg text-gray-900 flex-1 min-w-0 truncate">{activity.title}</h3>
                        <Badge className={`flex-shrink-0 text-xs ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label.split(" - ")[0]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activity.subjectName && (
                          <Badge variant="outline" className="text-xs">{activity.subjectName}</Badge>
                        )}
                        {activity.className && (
                          <Badge variant="outline" className="text-xs">{activity.className}</Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800 text-xs">{(activity as any).bimestre ? `${(activity as any).bimestre}º Bim` : '1º Bim'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-3">
                      {activity.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {activity.dueDate ? (
                            <span className={overdue ? "text-red-600 font-medium" : ""}>
                              {formatDate(activity.dueDate)}
                              {overdue && " (Vencida)"}
                            </span>
                          ) : "Sem prazo"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          Nota máx: {activity.maxScore}
                        </span>
                      </div>

                      {/* Submissão existente */}
                      {activity.mySubmission && (
                        <div className={`rounded-lg p-3 text-sm ${
                          activity.mySubmission.status === "graded"
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-blue-50 border border-blue-200"
                        }`}>
                          <a
                            href={activity.mySubmission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {activity.mySubmission.fileName}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(activity.mySubmission.fileSizeBytes)} - Enviado em {formatDate(activity.mySubmission.submittedAt)}
                          </p>
                          {activity.mySubmission.status === "graded" && (
                            <>
                              <p className="font-semibold text-emerald-700 mt-2">
                                Nota: {activity.mySubmission.score}/{activity.maxScore}
                              </p>
                              {activity.mySubmission.feedback && (
                                <p className="text-gray-600 mt-1 italic">
                                  Feedback: {activity.mySubmission.feedback}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="mt-auto pt-3">
                        {canSubmit(activity) ? (
                          <Button
                            onClick={() => { setSelectedActivity(activity); setShowSubmit(true); }}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                            size="sm"
                          >
                            <Upload className="mr-2 h-3 w-3" />
                            {activity.mySubmission ? "Reenviar Atividade" : "Enviar Atividade"}
                          </Button>
                        ) : activity.mySubmission?.status === "graded" ? (
                          <div className="text-center text-sm text-emerald-600 font-medium py-1">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Atividade avaliada
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Enviar Atividade */}
      <Dialog open={showSubmit} onOpenChange={(open) => {
        if (!open) { setShowSubmit(false); setSelectedFile(null); setComment(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Atividade</DialogTitle>
            <DialogDescription>{selectedActivity?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">
                Formatos aceitos: <strong>PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx)</strong> - máximo 16MB
              </p>
            </div>

            {/* Área de upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800">{selectedFile.name}</p>
                    <p className="text-xs text-blue-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Clique para selecionar o arquivo</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word ou PowerPoint</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="hidden"
              onChange={handleFileChange}
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Comentário (opcional)
              </label>
              <Textarea
                placeholder="Adicione uma observação sobre sua entrega..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSubmit(false); setSelectedFile(null); setComment(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading || submitMutation.isPending}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading || submitMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
