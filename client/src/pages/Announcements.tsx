import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Plus, Edit, Trash2, AlertCircle, Megaphone } from "lucide-react";
import { toast } from "sonner";
import Sidebar from '../components/Sidebar';
import PageWrapper from '../components/PageWrapper';

export function Announcements() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: announcementCounts } = trpc.subjects.getAnnouncementCounts.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      toast.success("Aviso criado com sucesso!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar aviso");
    },
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      toast.success("Aviso atualizado com sucesso!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar aviso");
    },
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => {
      utils.announcements.list.invalidate();
      toast.success("Aviso deletado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar aviso");
    },
  });

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setIsImportant(false);
    setSelectedSubjectId(null);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message || !selectedSubjectId) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title,
        message,
        isImportant,
      });
    } else {
      createMutation.mutate({
        title,
        message,
        isImportant,
        subjectId: selectedSubjectId,
      });
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setIsImportant(announcement.isImportant);
    setSelectedSubjectId(announcement.subjectId);
    setIsCreating(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este aviso?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Avisos</h1>
            <p className="text-gray-600">Poste anúncios importantes para seus alunos</p>
          </div>

          {/* Botão Novo Aviso */}
          {!isCreating && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Aviso
              </Button>
            </div>
          )}

          {/* Form */}
          {isCreating && (
            <div className="bg-green-50 border-green-200 p-6 rounded-lg border shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingId ? "Editar Aviso" : "Criar Novo Aviso"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disciplina *
                  </label>
                  <select
                    value={selectedSubjectId || ""}
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                    required
                    disabled={!!editingId}
                  >
                    <option value="">Selecione uma disciplina</option>
                    {subjects?.map((subject: any) => {
                      const count = announcementCounts?.[subject.id] || 0;
                      return (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code}){count > 0 ? ` - ${count} aviso${count > 1 ? 's' : ''}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: Prova na próxima semana"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={4}
                    placeholder="Digite a mensagem do aviso..."
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isImportant"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isImportant" className="text-sm text-gray-700">
                    Marcar como importante (destaque vermelho)
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingId ? "Atualizar" : "Criar"} Aviso
                  </Button>
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Avisos */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando avisos...</div>
            ) : announcements && announcements.length > 0 ? (
              announcements.map((announcement: any) => (
                <div
                  key={announcement.id}
                  className={`bg-white p-4 rounded-lg border-2 shadow-sm ${
                    announcement.isImportant
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.isImportant && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <h3 className="font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {announcement.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-medium text-blue-600">
                          {announcement.subjectName}
                        </span>
                        <span>
                          {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(announcement)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(announcement.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum aviso criado ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Clique em "Novo Aviso" para começar
                </p>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

export default Announcements;
