import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Plus, Edit, Trash2, AlertCircle, Megaphone, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";

export function Announcements() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();
  const { data: subjects } = trpc.subjects.list.useQuery();
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
    <PageWrapper>
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="container py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Megaphone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Avisos</h1>
                <p className="text-sm text-gray-600 mt-1">Poste anúncios importantes para seus alunos</p>
              </div>
            </div>
            
            {!isCreating && (
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Aviso
              </Button>
            )}
          </div>

          {/* Form */}
          {isCreating && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar Aviso" : "Criar Novo Aviso"}
                </h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Disciplina *</Label>
                    <select
                      id="subject"
                      value={selectedSubjectId || ""}
                      onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                      className="w-full p-2 border rounded-md bg-white"
                      required
                      disabled={!!editingId}
                    >
                      <option value="">Selecione uma disciplina</option>
                      {subjects?.map((subject: any) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Prova na próxima semana"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isImportant" className="font-normal cursor-pointer">
                      Marcar como importante (destaque vermelho)
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-2">
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
              </CardContent>
            </Card>
          )}

          {/* Lista de Avisos */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                Carregando avisos...
              </div>
            ) : announcements && announcements.length > 0 ? (
              announcements.map((announcement: any) => (
                <Card
                  key={announcement.id}
                  className={`transition-all duration-200 hover:shadow-lg ${
                    announcement.isImportant
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.isImportant && (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <h3 className="font-semibold text-gray-900 truncate">
                            {announcement.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <BookOpen className="w-3 h-3" />
                          <span className="font-medium text-blue-600 truncate">
                            {announcement.subjectName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {announcement.message}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(announcement)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(announcement.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Megaphone className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum aviso criado ainda</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Clique em "Novo Aviso" para começar
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Announcements;
