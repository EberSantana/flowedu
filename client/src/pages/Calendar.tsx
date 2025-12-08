import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarDays, ArrowLeft, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const EVENT_TYPES = {
  holiday: { label: "Feriado", color: "#ef4444" },
  commemorative: { label: "Data Comemorativa", color: "#f59e0b" },
  school_event: { label: "Evento Escolar", color: "#3b82f6" },
  personal: { label: "Observação Pessoal", color: "#8b5cf6" },
};

export default function Calendar() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventType: "personal" as "holiday" | "commemorative" | "school_event" | "personal",
    isRecurring: 0,
    color: "#8b5cf6",
  });

  const { data: events, isLoading } = trpc.calendar.listByYear.useQuery({ year: selectedYear });
  const utils = trpc.useUtils();

  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      utils.calendar.listByYear.invalidate();
      toast.success("Evento criado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });

  const updateMutation = trpc.calendar.update.useMutation({
    onSuccess: () => {
      utils.calendar.listByYear.invalidate();
      toast.success("Evento atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });

  const deleteMutation = trpc.calendar.delete.useMutation({
    onSuccess: () => {
      utils.calendar.listByYear.invalidate();
      toast.success("Evento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      eventType: "personal",
      isRecurring: 0,
      color: "#8b5cf6",
    });
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      eventDate: event.eventDate,
      eventType: event.eventType,
      isRecurring: event.isRecurring,
      color: event.color || EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddEvent = (month: number) => {
    const monthStr = String(month + 1).padStart(2, "0");
    setFormData({
      ...formData,
      eventDate: `${selectedYear}-${monthStr}-01`,
    });
    setIsDialogOpen(true);
  };

  const getEventsForMonth = (month: number) => {
    if (!events) return [];
    const monthStr = String(month + 1).padStart(2, "0");
    return events.filter((event) => event.eventDate.startsWith(`${selectedYear}-${monthStr}`));
  };

  const getDaysInMonth = (month: number) => {
    return new Date(selectedYear, month + 1, 0).getDate();
  };

  const getEventsByDate = (date: string) => {
    if (!events) return [];
    return events.filter((event) => event.eventDate === date);
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 lg:ml-64">
        <div className="container mx-auto py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarDays className="h-8 w-8 text-blue-600" />
                Calendário Anual
              </h1>
              <p className="text-gray-600 mt-2">
                Datas comemorativas e observações
              </p>
            </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(selectedYear - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-2xl font-bold text-gray-900 min-w-[100px] text-center">
                {selectedYear}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(selectedYear + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTHS.map((month, index) => {
              const monthEvents = getEventsForMonth(index);
              const daysInMonth = getDaysInMonth(index);
              
              return (
                <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{month}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddEvent(index)}
                        className="text-white hover:bg-white/20"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
                    {monthEvents.length > 0 ? (
                      <div className="space-y-2">
                        {monthEvents.map((event) => {
                          const day = parseInt(event.eventDate.split("-")[2]);
                          return (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                              style={{ borderLeftColor: event.color || EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].color }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700">{day}</span>
                                    <span className="font-semibold text-gray-900 truncate">
                                      {event.title}
                                    </span>
                                  </div>
                                  {event.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                  <span className="text-xs text-gray-500 mt-1 inline-block">
                                    {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].label}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEdit(event)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(event.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 text-sm py-8">
                        Nenhum evento cadastrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Editar Evento" : "Novo Evento"}
              </DialogTitle>
              <DialogDescription>
                Adicione datas comemorativas ou observações personalizadas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Dia do Professor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Data</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Tipo de Evento</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value: any) => {
                      setFormData({
                        ...formData,
                        eventType: value,
                        color: EVENT_TYPES[value as keyof typeof EVENT_TYPES].color,
                      });
                    }}
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Observações (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Adicione detalhes ou observações..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring === 1}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked ? 1 : 0 })}
                    className="rounded"
                  />
                  <Label htmlFor="isRecurring" className="font-normal cursor-pointer">
                    Repetir anualmente
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingEvent ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </>
  );
}
