import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarDays, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const EVENT_TYPES = {
  holiday: { label: "Feriado", color: "bg-red-500", dotColor: "#ef4444" },
  commemorative: { label: "Data Comemorativa", color: "bg-amber-500", dotColor: "#f59e0b" },
  school_event: { label: "Evento Escolar", color: "bg-blue-500", dotColor: "#3b82f6" },
  personal: { label: "Observação Pessoal", color: "bg-purple-500", dotColor: "#8b5cf6" },
};

export default function Calendar() {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    eventType: "personal" as keyof typeof EVENT_TYPES,
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

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(selectedYear, selectedMonth, day));
    }

    return days;
  }, [selectedYear, selectedMonth]);

  // Eventos do mês selecionado
  const monthEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event: any) => {
      const eventDate = new Date(event.eventDate);
      return eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    }).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [events, selectedMonth, selectedYear]);

  // Eventos por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!events) return map;
    
    events.forEach((event: any) => {
      const eventDate = new Date(event.eventDate);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    
    return map;
  }, [events]);

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
    setSelectedDate(null);
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
      eventDate: new Date(event.eventDate).toISOString().split('T')[0],
      eventType: event.eventType,
      isRecurring: event.isRecurring,
      color: event.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      eventDate: date.toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const previousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const getDayEvents = (date: Date | null) => {
    if (!date) return [];
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsByDay.get(key) || [];
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto py-6 px-4">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-blue-600" />
                Calendário
              </h1>
              <p className="text-gray-600 mt-1">
                {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'} em {MONTHS[selectedMonth]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário Principal */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={previousMonth}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-xl font-bold">
                      {MONTHS[selectedMonth]} {selectedYear}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextMonth}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-gray-600 py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grade de dias */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, index) => {
                      const dayEvents = getDayEvents(date);
                      const hasEvents = dayEvents.length > 0;

                      return (
                        <button
                          key={index}
                          onClick={() => date && handleDayClick(date)}
                          disabled={!date}
                          className={`
                            aspect-square p-2 rounded-lg border-2 transition-all
                            ${!date ? 'invisible' : ''}
                            ${isToday(date) ? 'border-blue-500 bg-blue-50 font-bold' : 'border-gray-200'}
                            ${date && !isToday(date) ? 'hover:border-blue-300 hover:bg-blue-50' : ''}
                            ${hasEvents ? 'bg-gradient-to-br from-white to-blue-50' : 'bg-white'}
                          `}
                        >
                          {date && (
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className={`text-sm ${isToday(date) ? 'text-blue-600' : 'text-gray-700'}`}>
                                {date.getDate()}
                              </span>
                              {hasEvents && (
                                <div className="flex gap-1 mt-1 flex-wrap justify-center">
                                  {dayEvents.slice(0, 3).map((event: any, i: number) => (
                                    <div
                                      key={i}
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].dotColor }}
                                    />
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Legenda:</p>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(EVENT_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.dotColor }} />
                          <span className="text-xs text-gray-600">{value.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral - Lista de Eventos */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Eventos do Mês</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDate(new Date(selectedYear, selectedMonth, today.getDate()));
                        setFormData({
                          ...formData,
                          eventDate: new Date(selectedYear, selectedMonth, today.getDate()).toISOString().split('T')[0],
                        });
                        setIsDialogOpen(true);
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                  ) : monthEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Nenhum evento este mês</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDate(new Date(selectedYear, selectedMonth, today.getDate()));
                          setFormData({
                            ...formData,
                            eventDate: new Date(selectedYear, selectedMonth, today.getDate()).toISOString().split('T')[0],
                          });
                          setIsDialogOpen(true);
                        }}
                        className="mt-3"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Evento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monthEvents.map((event: any) => {
                        const eventDate = new Date(event.eventDate);
                        const eventType = EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES];
                        
                        return (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                            style={{ borderLeftColor: eventType.dotColor }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {event.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {eventDate.getDate()} de {MONTHS[eventDate.getMonth()]}
                                </p>
                                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${eventType.color}`}>
                                  {eventType.label}
                                </span>
                                {event.description && (
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEdit(event)}
                                  className="h-7 w-7"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(event.id)}
                                  className="h-7 w-7"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Dialog de Criação/Edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
              <DialogDescription>
                {editingEvent ? "Atualize as informações do evento" : "Adicione um novo evento ao calendário"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Dia do Professor"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eventDate">Data *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Tipo *</Label>
                  <Select value={formData.eventType} onValueChange={(value: any) => setFormData({ ...formData, eventType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
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
      </PageWrapper>
    </>
  );
}
