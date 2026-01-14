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
import { CalendarDays, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Clock, Upload, FileText, Check, X } from "lucide-react";
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
  
  // Estados para importação de PDF
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  
  // Estados para atualização anual
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateYear, setUpdateYear] = useState<number>(new Date().getFullYear() - 1);
  const [newYearEvents, setNewYearEvents] = useState<any[]>([]);
  const [eventsToDelete, setEventsToDelete] = useState<any[]>([]);

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
  
  const importMutation = trpc.calendar.importFromPDF.useMutation({
    onSuccess: (events) => {
      setExtractedEvents(events);
      setSelectedEvents(new Set(events.map((_: any, i: number) => i)));
      setIsProcessing(false);
      toast.success(`${events.length} eventos extraídos com sucesso!`);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast.error("Erro ao processar PDF: " + error.message);
    },
  });
  
  const bulkCreateMutation = trpc.calendar.bulkCreate.useMutation({
    onSuccess: (result) => {
      utils.calendar.listByYear.invalidate();
      toast.success(`${result.count} eventos importados com sucesso!`);
      setIsImportDialogOpen(false);
      setExtractedEvents([]);
      setSelectedEvents(new Set());
    },
    onError: (error) => {
      toast.error("Erro ao importar eventos: " + error.message);
    },
  });
  
  const updateAnnualMutation = trpc.calendar.updateCalendarAnnually.useMutation({
    onSuccess: (result) => {
      utils.calendar.listByYear.invalidate();
      toast.success(`Calendário atualizado! ${result.deletedCount} eventos removidos, ${result.addedCount} novos eventos adicionados.`);
      setIsUpdateDialogOpen(false);
      setNewYearEvents([]);
      setEventsToDelete([]);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar calendário: " + error.message);
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
  
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }
    
    setIsProcessing(true);
    
    // Converter para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        importMutation.mutate({ pdfBase64: base64 });
      }
    };
    reader.readAsDataURL(file);
  };
  
  const toggleEventSelection = (index: number) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedEvents(newSelection);
  };
  
  const handleConfirmImport = () => {
    const eventsToImport = extractedEvents.filter((_, i) => selectedEvents.has(i));
    bulkCreateMutation.mutate({ events: eventsToImport });
  };
  
  const handleUpdatePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }
    
    setIsProcessing(true);
    toast.info('Processando PDF...');
    
    // Converter para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        try {
          const extractedEventsData = await importMutation.mutateAsync({ pdfBase64: base64 });
          setNewYearEvents(extractedEventsData);
          
          // Calcular eventos a deletar (apenas institucionais do ano selecionado)
          const yearEvents = events?.filter(e => {
            const eventYear = new Date(e.eventDate).getFullYear();
            return eventYear === updateYear && e.eventType !== 'personal';
          }) || [];
          setEventsToDelete(yearEvents);
          
          setIsProcessing(false);
          toast.success(`Preview pronto! ${yearEvents.length} eventos serão removidos, ${extractedEventsData.length} serão adicionados.`);
        } catch (error: any) {
          setIsProcessing(false);
          toast.error('Erro ao processar PDF: ' + error.message);
        }
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleConfirmUpdate = () => {
    if (newYearEvents.length === 0) {
      toast.error('Por favor, faça upload do novo calendário PDF primeiro');
      return;
    }
    
    updateAnnualMutation.mutate({
      year: updateYear,
      newEvents: newYearEvents
    });
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
                <CalendarDays className="w-8 h-8 text-primary" />
                Calendário
              </h1>
              <p className="text-gray-600 mt-1">
                {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'} em {MONTHS[selectedMonth]}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsUpdateDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Clock className="w-4 h-4 mr-2" />
                Atualizar Calendário Anual
              </Button>
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Calendário PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário Principal */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
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
                            ${isToday(date) ? 'border-primary bg-primary/10 font-bold' : 'border-gray-200'}
                            ${date && !isToday(date) ? 'hover:border-primary/50 hover:bg-primary/5' : ''}
                            ${hasEvents ? 'bg-gradient-to-br from-white to-primary/5' : 'bg-white'}
                          `}
                        >
                          {date && (
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className={`text-sm ${isToday(date) ? 'text-primary' : 'text-gray-700'}`}>
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
                <CardHeader className="bg-gradient-to-r from-accent to-accent/80 text-white rounded-t-lg">
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
                                  <Pencil className="w-3.5 h-3.5 text-primary" />
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
        
        {/* Dialog de Importação de PDF */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-success" />
                Importar Calendário Escolar (PDF)
              </DialogTitle>
              <DialogDescription>
                Faça upload do PDF do calendário escolar para extrair automaticamente todos os eventos.
              </DialogDescription>
            </DialogHeader>
            
            {extractedEvents.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-success transition-colors">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">Clique para selecionar o PDF</span>
                    <p className="text-sm text-gray-500 mt-2">ou arraste e solte aqui</p>
                  </Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
                
                {isProcessing && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-success mb-4"></div>
                    <p className="text-gray-600">Processando PDF e extraindo eventos...</p>
                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-success/10 p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-success">{extractedEvents.length} eventos extraídos</p>
                    <p className="text-sm text-success/80">{selectedEvents.size} selecionados para importar</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvents(new Set(extractedEvents.map((_: any, i: number) => i)))}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Selecionar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEvents(new Set())}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpar Seleção
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {extractedEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedEvents.has(index)
                          ? 'border-success bg-success/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleEventSelection(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedEvents.has(index) ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{event.title}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].color
                            } text-white`}>
                              {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{event.description}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.eventDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExtractedEvents([]);
                      setSelectedEvents(new Set());
                      setIsImportDialogOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={selectedEvents.size === 0 || bulkCreateMutation.isPending}
                    className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
                  >
                    {bulkCreateMutation.isPending ? 'Importando...' : `Importar ${selectedEvents.size} Eventos`}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Dialog de Atualização Anual */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Clock className="w-6 h-6 text-purple-600" />
                Atualizar Calendário Anual
              </DialogTitle>
              <DialogDescription>
                Substitua os eventos institucionais do ano anterior pelo novo calendário escolar.
                Suas observações pessoais serão preservadas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Seleção de ano e upload */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ano a ser substituído</Label>
                  <Select
                    value={updateYear.toString()}
                    onValueChange={(v) => setUpdateYear(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Novo calendário (PDF)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpdatePDFUpload}
                    disabled={isProcessing}
                  />
                </div>
              </div>
              
              {/* Preview de mudanças */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold mb-3 text-lg">Resumo das Alterações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-700">Eventos a Remover</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">{eventsToDelete.length}</p>
                      <p className="text-xs text-red-600 mt-1">Feriados, datas comemorativas e eventos escolares de {updateYear}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-success/30 bg-success/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-success">Eventos a Adicionar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-success">{newYearEvents.length}</p>
                      <p className="text-xs text-success/80 mt-1">Novos eventos do calendário escolar</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Aviso sobre preservação */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="text-purple-600 mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Observações Pessoais Preservadas</h4>
                    <p className="text-sm text-purple-700">
                      Todos os eventos do tipo "Observação Pessoal" serão mantidos intactos.
                      Apenas eventos institucionais (feriados, datas comemorativas e eventos escolares) serão substituídos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={newYearEvents.length === 0 || updateAnnualMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {updateAnnualMutation.isPending ? 'Aplicando...' : 'Aplicar Atualização'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </>
  );
}
