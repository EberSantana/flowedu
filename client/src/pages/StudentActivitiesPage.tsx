import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Clock, CheckCircle, Star, AlertCircle, Download, X } from "lucide-react";

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
      // Converter arquivo para base64
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
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

  function getStatusBadge(activity: Activity) {
    if (activity.mySubmission?.status === "graded") {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
          <CheckCircle className="w-3 h-3" />
          Avaliado — {activity.mySubmission.score}/{activity.maxScore}
        </span>
      );
    }
    if (activity.mySubmission?.status === "submitted") {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
          <Clock className="w-3 h-3" />
          Enviado — aguardando avaliação
        </span>
      );
    }
    if (activity.status === "closed" || isPastDue(activity.dueDate)) {
      return (
        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
          <AlertCircle className="w-3 h-3" />
          Prazo encerrado
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
        <Clock className="w-3 h-3" />
        Pendente
      </span>
    );
  }

  const canSubmit = (activity: Activity) =>
    activity.status === "published" &&
    !isPastDue(activity.dueDate) &&
    activity.mySubmission?.status !== "graded";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Minhas Atividades</h1>
          <p className="text-blue-300 text-sm mt-1">Visualize e entregue suas atividades</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-blue-300">Carregando atividades...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <FileText className="w-12 h-12 text-blue-400/40 mx-auto mb-3" />
            <p className="text-blue-200 font-medium">Nenhuma atividade disponível</p>
            <p className="text-blue-400 text-sm mt-1">Seu professor ainda não publicou atividades</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activities as Activity[]).map((activity) => (
              <div
                key={activity.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{activity.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activity.subjectName && (
                        <span className="text-xs text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-full">
                          {activity.subjectName}
                        </span>
                      )}
                      {activity.className && (
                        <span className="text-xs text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded-full">
                          {activity.className}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(activity)}
                </div>

                {activity.description && (
                  <p className="text-blue-200 text-sm mb-3 leading-relaxed">{activity.description}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-blue-300 mb-4">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Nota máxima: {activity.maxScore}
                  </span>
                  {activity.dueDate && (
                    <span className={`flex items-center gap-1 ${isPastDue(activity.dueDate) ? "text-red-400" : ""}`}>
                      <Clock className="w-3 h-3" />
                      Prazo: {new Date(activity.dueDate).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>

                {/* Submissão existente */}
                {activity.mySubmission && (
                  <div className={`rounded-xl p-3 mb-3 ${
                    activity.mySubmission.status === "graded"
                      ? "bg-green-900/30 border border-green-500/30"
                      : "bg-blue-900/30 border border-blue-500/30"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-300" />
                      <a
                        href={activity.mySubmission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-white text-sm flex items-center gap-1"
                      >
                        {activity.mySubmission.fileName}
                        <Download className="w-3 h-3" />
                      </a>
                      <span className="text-blue-400 text-xs">
                        ({formatFileSize(activity.mySubmission.fileSizeBytes)})
                      </span>
                    </div>
                    {activity.mySubmission.feedback && (
                      <div className="mt-2 text-sm text-green-300 bg-green-900/20 rounded-lg p-2">
                        <span className="font-medium">Feedback do professor:</span> {activity.mySubmission.feedback}
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de ação */}
                {canSubmit(activity) && (
                  <Button
                    onClick={() => { setSelectedActivity(activity); setShowSubmit(true); }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {activity.mySubmission ? "Reenviar Atividade" : "Enviar Atividade"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Enviar Atividade */}
      <Dialog open={showSubmit} onOpenChange={(open) => {
        if (!open) { setShowSubmit(false); setSelectedFile(null); setComment(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">{selectedActivity?.title}</p>
              <p className="text-xs mt-1 text-gray-500">
                Formatos aceitos: <strong>PDF, Word (.doc/.docx), PowerPoint (.ppt/.pptx)</strong> — máximo 16MB
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
    </div>
  );
}
