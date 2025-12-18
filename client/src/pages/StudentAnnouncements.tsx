import { trpc } from "../lib/trpc";
import { AlertCircle, Megaphone, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import StudentLayout from '../components/StudentLayout';

export function StudentAnnouncements() {
  const { data: announcements, isLoading } = trpc.announcements.getForStudent.useQuery();
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Avisos</h1>
          <p className="text-gray-600">Anúncios importantes dos seus professores</p>
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
    </StudentLayout>
  );
}

export default StudentAnnouncements;
