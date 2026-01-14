import { trpc } from "../lib/trpc";
import { AlertCircle, Megaphone, CheckCircle, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import StudentLayout from '../components/StudentLayout';
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export function StudentAnnouncements() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  
  const { data: announcements, isLoading } = trpc.announcements.getForStudent.useQuery(
    selectedSubjectId ? { subjectId: selectedSubjectId } : undefined
  );
  const { data: enrolledSubjects } = trpc.student.getEnrolledSubjects.useQuery();
  const utils = trpc.useUtils();

  const markAsReadMutation = trpc.announcements.markAsRead.useMutation({
    onSuccess: () => {
      utils.announcements.getForStudent.invalidate();
      utils.announcements.getUnreadCount.invalidate();
      toast.success("Aviso marcado como lido");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao marcar como lido");
    },
  });

  const handleMarkAsRead = (announcementId: number) => {
    markAsReadMutation.mutate({ announcementId });
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Megaphone className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Avisos</h1>
                <p className="text-blue-100 mt-1">
                  Anúncios importantes dos seus professores
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          {/* Filtro de Disciplina */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filtrar por disciplina:</span>
              </div>
              <Select
                value={selectedSubjectId?.toString() || "all"}
                onValueChange={(value) => setSelectedSubjectId(value === "all" ? undefined : Number(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Todas as disciplinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as disciplinas</SelectItem>
                  {enrolledSubjects?.map((enrollment: any) => (
                    <SelectItem key={enrollment.subjectId} value={enrollment.subjectId.toString()}>
                      {enrollment.subject?.name || 'Disciplina'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubjectId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubjectId(undefined)}
                >
                  Limpar filtro
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Carregando avisos...</div>
            ) : announcements && announcements.length > 0 ? (
              announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className={`bg-white p-5 rounded-lg border-2 shadow-sm transition-all ${
                  announcement.isImportant
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                } ${
                  !announcement.isRead
                    ? "ring-2 ring-blue-200"
                    : "opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isImportant && (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {announcement.title}
                      </h3>
                      {!announcement.isRead && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          Novo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-medium text-blue-600">
                        {announcement.subjectName}
                      </span>
                      <span>
                        {new Date(announcement.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {!announcement.isRead && (
                    <Button
                      onClick={() => handleMarkAsRead(announcement.id)}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      disabled={markAsReadMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marcar como lido
                    </Button>
                  )}
                </div>
              </div>
            ))
            ) : (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhum aviso disponível</p>
              <p className="text-sm text-gray-400 mt-2">
                Seus professores ainda não postaram avisos
              </p>
            </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default StudentAnnouncements;
