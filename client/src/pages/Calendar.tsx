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
import { CalendarDays, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Clock, Upload, FileText, Check, X, Download, Share2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
    eventType: "personal" as "personal" | "holiday" | "commemorative" | "school_event",
    isRecurring: 0,
    color: "#8b5cf6",
  });
  
  // Estados para importação de PDF
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  
  // Estados para exportação
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportIncludeSchedule, setExportIncludeSchedule] = useState(false);
  const [exportEventTypes, setExportEventTypes] = useState<string[]>(["holiday", "commemorative", "school_event", "personal"]);
  const [isExporting, setIsExporting] = useState(false);

  // Estado para visualizar detalhes de evento
  const [viewingEvent, setViewingEvent] = useState<any>(null);

  // Estados para atualização anual
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateYear, setUpdateYear] = useState<number>(new Date().getFullYear() - 1);
  const [newYearEvents, setNewYearEvents] = useState<any[]>([]);
  const [eventsToDelete, setEventsToDelete] = useState<any[]>([]);

  // Estado para filtro de tipo de calendário
  const [selectedCalendarType, setSelectedCalendarType] = useState<string>('todos');

  const { data: events, isLoading } = trpc.calendar.listByYear.useQuery({ year: selectedYear, calendarType: selectedCalendarType });
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
  // Helper para parsear YYYY-MM-DD sem timezone issues
  const parseDateStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y, month: m - 1, day: d }; // month é 0-indexed
  };

  const monthEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event: any) => {
      const { year, month } = parseDateStr(event.eventDate);
      return month === selectedMonth && year === selectedYear;
    }).sort((a: any, b: any) => a.eventDate.localeCompare(b.eventDate));
  }, [events, selectedMonth, selectedYear]);

  // Eventos por dia
  const eventsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    if (events) {
      events.forEach((event: any) => {
        const { year, month, day } = parseDateStr(event.eventDate);
        const key = `${year}-${month}-${day}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(event);
      });
    }
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
      eventDate: event.eventDate, // Já é YYYY-MM-DD, não converter via Date
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
          console.log('[Calendar] Iniciando extração de eventos do PDF...');
          const extractedEventsData = await importMutation.mutateAsync({ pdfBase64: base64 });
          console.log('[Calendar] Eventos extraídos:', extractedEventsData.length);
          setNewYearEvents(extractedEventsData);
          
          // Calcular eventos a deletar (apenas institucionais do ano selecionado)
          const yearEvents = events?.filter(e => {
            const eventYear = parseInt(e.eventDate.substring(0, 4));
            return eventYear === updateYear && e.eventType !== 'personal';
          }) || [];
          setEventsToDelete(yearEvents);
          
          setIsProcessing(false);
          toast.success(`Preview pronto! ${yearEvents.length} eventos serão removidos, ${extractedEventsData.length} serão adicionados.`);
        } catch (error: any) {
          console.error('[Calendar] Erro ao processar PDF:', error);
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

  const handleExportICS = async () => {
    setIsExporting(true);
    try {
      const result = await utils.client.calendar.exportToICS.query({
        year: selectedYear,
        includeSchedule: exportIncludeSchedule,
        eventTypes: exportEventTypes as any,
      });
      
      // Criar e baixar o arquivo .ics
      const blob = new Blob([result.icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FlowEdu_Calendario_${selectedYear}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Arquivo exportado com ${result.totalEvents} eventos!`);
      setIsExportDialogOpen(false);
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGoogleCalendar = async () => {
    setIsExporting(true);
    try {
      const result = await utils.client.calendar.exportToICS.query({
        year: selectedYear,
        includeSchedule: exportIncludeSchedule,
        eventTypes: exportEventTypes as any,
      });
      
      // Criar blob e upload temporário
      const blob = new Blob([result.icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Abrir Google Calendar com importação
      // Google Calendar não suporta importação direta via URL, então baixamos o .ics
      // e instruímos o usuário a importar
      const link = document.createElement('a');
      link.href = url;
      link.download = `FlowEdu_Calendario_${selectedYear}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Abrir a página de importação do Google Calendar
      window.open('https://calendar.google.com/calendar/r/settings/export', '_blank');
      
      toast.success(
        `Arquivo baixado com ${result.totalEvents} eventos! Importe-o no Google Calendar que acabou de abrir.`,
        { duration: 8000 }
      );
      setIsExportDialogOpen(false);
    } catch (error: any) {
      toast.error('Erro ao exportar: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDayClick = (date: Date) => {
    const dayEvts = getDayEvents(date);
    if (dayEvts.length === 1) {
      // Se há exatamente 1 evento, abre direto o modal de detalhes
      setViewingEvent(dayEvts[0]);
    } else if (dayEvts.length > 1) {
      // Se há múltiplos eventos, abre modal de detalhes do primeiro (lista)
      setViewingEvent({ _multiple: true, _date: date, _events: dayEvts });
    } else {
      // Sem eventos: abre form de criação
      setSelectedDate(date);
      setFormData({
        ...formData,
        eventDate: date.toISOString().split('T')[0],
      });
      setIsDialogOpen(true);
    }
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
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Voltar ao Dashboard */}
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </button>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <CalendarDays className="w-8 h-8 text-primary" />
                Calendário
              </h1>
              <p className="text-gray-600 mt-1">
                {monthEvents.length} {monthEvents.length === 1 ? 'evento' : 'eventos'} em {MONTHS[selectedMonth]}
              </p>
              {/* Seletor de tipo de calendário */}
              <div className="flex gap-2 mt-3">
                {[
                  { value: 'todos', label: 'Todos', color: 'bg-gray-600' },
                  { value: 'integrado', label: 'Integrado', color: 'bg-blue-600' },
                  { value: 'subsequente_graduacao', label: 'Subsequente/Graduação', color: 'bg-emerald-600' },
                  { value: 'geral', label: 'Geral', color: 'bg-purple-600' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedCalendarType(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border-2 ${
                      selectedCalendarType === opt.value
                        ? `${opt.color} text-white border-transparent shadow-md`
                        : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsUpdateDialogOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
              >
                <Clock className="w-4 h-4 mr-2" />
                Atualizar Calendário Anual
              </Button>
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                className="bg-success text-success-foreground hover:bg-success/90 shadow-md"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Calendário PDF
              </Button>
              <Button
                onClick={() => setIsExportDialogOpen(true)}
                className="bg-secondary text-secondary-foreground border-2 border-primary/30 hover:bg-primary hover:text-primary-foreground shadow-md transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Calendário
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
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[10px] sm:text-sm font-semibold text-gray-600 py-1 sm:py-2"
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grade de dias */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calendarDays.map((date, index) => {
                      const dayEvents = getDayEvents(date);
                      const hasEvents = dayEvents.length > 0;

                      return (
                        <button
                          key={index}
                          onClick={() => date && handleDayClick(date)}
                          disabled={!date}
                          className={`
                            aspect-square p-0.5 sm:p-2 rounded-md sm:rounded-lg border sm:border-2 transition-all
                            ${!date ? 'invisible' : ''}
                            ${isToday(date) ? 'border-primary bg-primary/10 font-bold' : 'border-gray-200'}
                            ${date && !isToday(date) ? 'hover:border-primary/50 hover:bg-primary/5' : ''}
                            ${hasEvents ? 'bg-gradient-to-br from-white to-primary/5' : 'bg-white'}
                          `}
                        >
                          {date && (
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className={`text-[10px] sm:text-sm ${isToday(date) ? 'text-primary' : 'text-gray-700'}`}>
                                {date.getDate()}
                              </span>
                              {hasEvents && (
                                <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1 flex-wrap justify-center">
                                  {dayEvents.slice(0, 3).map((event: any, i: number) => (
                                    <div
                                      key={i}
                                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
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
                      <p className="text-muted-foreground text-sm">Nenhum evento este mês</p>
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
                        const { day: evDay, month: evMonth } = parseDateStr(event.eventDate);
                        const eventType = EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES] || { label: event.eventType, color: 'bg-gray-500', dotColor: '#6b7280' };
                        
                        return (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            style={{ borderLeftColor: eventType.dotColor }}
                            onClick={() => setViewingEvent(event)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {event.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {evDay} de {MONTHS[evMonth]}
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
                              <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
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
          <DialogContent className="sm:!max-w-2xl md:!max-w-3xl lg:!max-w-4xl max-h-[80vh] !flex !flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-success" />
                Importar Calendário Escolar (PDF)
              </DialogTitle>
              <DialogDescription>
                Faça upload do PDF do calendário escolar para extrair automaticamente todos os eventos.
              </DialogDescription>
            </DialogHeader>
            
            {extractedEvents.length === 0 ? (
              <div className="space-y-4 overflow-y-auto flex-1">
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
                    <p className="text-muted-foreground">Processando PDF e extraindo eventos...</p>
                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-shrink-0 flex items-center justify-between bg-success/10 p-4 rounded-lg">
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
                
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
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
                            {(() => {
                              const parts = event.eventDate.split('-');
                              return `${parts[2]}/${parts[1]}/${parts[0]}`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
                    className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md"
                  >
                    {bulkCreateMutation.isPending ? 'Importando...' : `Importar ${selectedEvents.size} Eventos`}
                  </Button>
                </DialogFooter>
              </>
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
        {/* Dialog de Exportação para Google Calendar / iCal */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Download className="w-5 h-5 text-primary" />
                Exportar Calendário
              </DialogTitle>
              <DialogDescription>
                Exporte seus eventos para Google Calendar, Apple Calendar ou qualquer aplicativo compatível com iCal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5">
              {/* Ano */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ano</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tipos de eventos */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Tipos de Eventos</Label>
                <div className="space-y-3">
                  {Object.entries(EVENT_TYPES).map(([key, { label, dotColor }]) => (
                    <div key={key} className="flex items-center gap-3">
                      <Checkbox
                        id={`export-${key}`}
                        checked={exportEventTypes.includes(key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExportEventTypes(prev => [...prev, key]);
                          } else {
                            setExportEventTypes(prev => prev.filter(t => t !== key));
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
                        <label htmlFor={`export-${key}`} className="text-sm cursor-pointer">{label}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Incluir grade semanal */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <Checkbox
                  id="export-schedule"
                  checked={exportIncludeSchedule}
                  onCheckedChange={(checked) => setExportIncludeSchedule(!!checked)}
                />
                <div>
                  <label htmlFor="export-schedule" className="text-sm font-medium cursor-pointer block">
                    Incluir Aulas da Grade Semanal
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adiciona todas as aulas semanais como eventos com horário no calendário
                  </p>
                </div>
              </div>
              
              {/* Resumo */}
              {events && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>{events.filter((e: any) => exportEventTypes.includes(e.eventType)).length}</strong> eventos do calendário serão exportados
                    {exportIncludeSchedule && " + aulas da grade semanal"}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExportDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExportICS}
                disabled={isExporting || exportEventTypes.length === 0}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {isExporting ? (
                  <><span className="animate-spin mr-2">⏳</span> Gerando...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Baixar arquivo .ics</>
                )}
              </Button>
              <Button
                onClick={handleExportGoogleCalendar}
                disabled={isExporting || exportEventTypes.length === 0}
                variant="outline"
                className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                {isExporting ? (
                  <><span className="animate-spin mr-2">⏳</span> Gerando...</>
                ) : (
                  <><Share2 className="w-4 h-4 mr-2" /> Abrir no Google Calendar</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      {/* Modal de Detalhes do Evento */}
      <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
        <DialogContent className="max-w-md">
          {viewingEvent && !viewingEvent._multiple ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: EVENT_TYPES[viewingEvent.eventType as keyof typeof EVENT_TYPES]?.dotColor || '#6b7280' }}
                  />
                  <DialogTitle className="text-lg">{viewingEvent.title}</DialogTitle>
                </div>
                <DialogDescription asChild>
                  <div className="space-y-1 pt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium text-white ${
                      EVENT_TYPES[viewingEvent.eventType as keyof typeof EVENT_TYPES]?.color || 'bg-gray-500'
                    }`}>
                      {EVENT_TYPES[viewingEvent.eventType as keyof typeof EVENT_TYPES]?.label || viewingEvent.eventType}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {(() => {
                      const { day, month, year } = parseDateStr(viewingEvent.eventDate);
                      return `${day} de ${MONTHS[month]} de ${year}`;
                    })()}
                  </span>
                </div>
                {viewingEvent.description && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{viewingEvent.description}</p>
                  </div>
                )}
                {viewingEvent.isRecurring ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Evento recorrente
                  </p>
                ) : null}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewingEvent(null);
                    handleEdit(viewingEvent);
                  }}
                  className="gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setViewingEvent(null);
                    handleDelete(viewingEvent.id);
                  }}
                  className="gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewingEvent(null)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          ) : viewingEvent?._multiple ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {viewingEvent._events.length} eventos em {viewingEvent._date.getDate()} de {MONTHS[viewingEvent._date.getMonth()]}
                </DialogTitle>
                <DialogDescription>Clique em um evento para ver os detalhes</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2 max-h-80 overflow-y-auto">
                {viewingEvent._events.map((evt: any) => {
                  const evtType = EVENT_TYPES[evt.eventType as keyof typeof EVENT_TYPES];
                  return (
                    <button
                      key={evt.id}
                      onClick={() => setViewingEvent(evt)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: evtType?.dotColor }} />
                        <span className="font-medium text-sm">{evt.title}</span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-5 line-clamp-1">{evt.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => setViewingEvent(null)}>Fechar</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      </PageWrapper>
    </>
  );
}
