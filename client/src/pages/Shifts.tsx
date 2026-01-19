import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Clock, Plus, Pencil, Trash2, ArrowLeft, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Shifts() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    displayOrder: 1,
  });

  const { data: shifts, isLoading } = trpc.shifts.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.shifts.create.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      toast.success("Turno criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar turno: " + error.message);
    },
  });

  const updateMutation = trpc.shifts.update.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      toast.success("Turno atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar turno: " + error.message);
    },
  });

  const deleteMutation = trpc.shifts.delete.useMutation({
    onSuccess: () => {
      utils.shifts.list.invalidate();
      toast.success("Turno excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir turno: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", color: "#3b82f6", displayOrder: 1 });
    setEditingShift(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift) {
      updateMutation.mutate({ id: editingShift.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      color: shift.color || "#3b82f6",
      displayOrder: shift.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este turno? Todos os horários associados também serão perdidos.")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleManageTimeSlots = (shiftId: number) => {
    setLocation(`/shifts/${shiftId}/timeslots`);
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto py-8">
          <Breadcrumb items={[{ label: "Planejamento" }, { label: "Turnos" }]} />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                Configurar Turnos
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie os turnos e seus horários antes de criar a grade de aulas
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
            Novo Turno
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : shifts && shifts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <Card key={shift.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader style={{ backgroundColor: shift.color }} className="text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{shift.name}</CardTitle>
                    <div className="text-sm opacity-90">Ordem: {shift.displayOrder}</div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleManageTimeSlots(shift.id)}
                      className="w-full"
                    >
                      <Settings className="mr-2 h-3 w-3" />
                      Gerenciar Horários
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(shift)}
                        className="flex-1"
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(shift.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum turno cadastrado ainda.</p>
              <p className="text-sm text-gray-500 mb-4">
                Comece criando os turnos (ex: Matutino, Vespertino, Noturno)
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Turno
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingShift ? "Editar Turno" : "Novo Turno"}
              </DialogTitle>
              <DialogDescription>
                Configure o nome, cor e ordem de exibição do turno.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Turno</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Matutino"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Define a ordem em que os turnos aparecem na grade (1 = primeiro)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingShift ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
