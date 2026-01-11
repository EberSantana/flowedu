import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassesListSkeleton } from "@/components/ui/skeleton-loaders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function Classes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const { data: classes, isLoading } = trpc.classes.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("Turma criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar turma: " + error.message);
    },
  });

  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("Turma atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar turma: " + error.message);
    },
  });

  const deleteMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("Turma excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir turma: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "" });
    setEditingClass(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      code: classItem.code,
      description: classItem.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta turma?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="container mx-auto py-4 sm:py-6 lg:py-8">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-600" />
                Gerenciar Turmas
              </h1>
            </div>
            <Button 
              onClick={() => setIsDialogOpen(true)} 
              size="lg"
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </div>

        {isLoading ? (
          <ClassesListSkeleton count={6} />
        ) : classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle>{classItem.name}</CardTitle>
                  <CardDescription>Código: {classItem.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  {classItem.description && (
                    <p className="text-sm text-gray-600 mb-4">{classItem.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhuma turma cadastrada"
            description="Comece criando sua primeira turma para organizar seus alunos e aulas."
            actionLabel="Criar Primeira Turma"
            onAction={() => setIsDialogOpen(true)}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? "Editar Turma" : "Nova Turma"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da turma abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: 1º Ano A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: 1A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da turma"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <LoadingButton 
                  type="submit"
                  loading={createMutation.isPending || updateMutation.isPending}
                  loadingText={editingClass ? "Atualizando..." : "Criando..."}
                >
                  {editingClass ? "Atualizar" : "Criar"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
