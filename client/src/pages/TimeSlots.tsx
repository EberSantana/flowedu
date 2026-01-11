import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Clock, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function TimeSlots() {
  const [, params] = useRoute("/shifts/:shiftId/timeslots");
  const shiftId = params?.shiftId ? parseInt(params.shiftId) : 0;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [formData, setFormData] = useState({
    slotNumber: 1,
    startTime: "",
    endTime: "",
  });

  const { data: shift } = trpc.shifts.list.useQuery(undefined, {
    select: (shifts) => shifts.find((s) => s.id === shiftId),
  });
  const { data: timeSlots, isLoading } = trpc.timeSlots.listByShift.useQuery({ shiftId });
  const utils = trpc.useUtils();

  const createMutation = trpc.timeSlots.create.useMutation({
    onSuccess: () => {
      utils.timeSlots.listByShift.invalidate();
      toast.success("Horário criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar horário: " + error.message);
    },
  });

  const updateMutation = trpc.timeSlots.update.useMutation({
    onSuccess: () => {
      utils.timeSlots.listByShift.invalidate();
      toast.success("Horário atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar horário: " + error.message);
    },
  });

  const deleteMutation = trpc.timeSlots.delete.useMutation({
    onSuccess: () => {
      utils.timeSlots.listByShift.invalidate();
      toast.success("Horário excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir horário: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ slotNumber: 1, startTime: "", endTime: "" });
    setEditingSlot(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot.id, ...formData });
    } else {
      createMutation.mutate({ shiftId, ...formData });
    }
  };

  const handleEdit = (slot: any) => {
    setEditingSlot(slot);
    setFormData({
      slotNumber: slot.slotNumber,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este horário?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (!shift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Turno não encontrado</p>
          <Link href="/shifts">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Turnos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/shifts">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Turnos
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: shift.color }}
              >
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{shift.name}</h1>
                <p className="text-gray-600">Gerenciar horários do turno</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Novo Horário
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : timeSlots && timeSlots.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {timeSlots.map((slot) => (
              <Card key={slot.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: shift.color }}
                      >
                        {slot.slotNumber}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="text-sm text-gray-600">
                          Tempo {slot.slotNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(slot)}
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(slot.id)}
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
              <p className="text-gray-600 mb-4">Nenhum horário cadastrado ainda.</p>
              <p className="text-sm text-gray-500 mb-4">
                Adicione os horários para este turno (ex: 07:15 - 08:05)
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Horário
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSlot ? "Editar Horário" : "Novo Horário"}
              </DialogTitle>
              <DialogDescription>
                Configure o número do tempo e os horários de início e fim.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="slotNumber">Número do Tempo</Label>
                  <Input
                    id="slotNumber"
                    type="number"
                    min="1"
                    value={formData.slotNumber}
                    onChange={(e) => setFormData({ ...formData, slotNumber: parseInt(e.target.value) })}
                    placeholder="Ex: 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Horário de Início</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Horário de Término</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSlot ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
