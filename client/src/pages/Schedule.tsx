import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, ArrowLeft, Plus, Trash2, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { createEvents, EventAttributes, DateArray } from "ics";

const DAYS_OF_WEEK = [
  { id: 1, name: "Segunda-Feira", short: "Seg" },
  { id: 2, name: "Terça-Feira", short: "Ter" },
  { id: 3, name: "Quarta-Feira", short: "Qua" },
  { id: 4, name: "Quinta-Feira", short: "Qui" },
  { id: 5, name: "Sexta-Feira", short: "Sex" },
  { id: 6, name: "Sábado", short: "Sáb" },
];

export default function Schedule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [filterShiftId, setFilterShiftId] = useState<string>("");
  const [formData, setFormData] = useState({
    subjectId: "",
    classId: "",
    timeSlotId: "",
    dayOfWeek: "",
    notes: "",
  });
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedClassForStatus, setSelectedClassForStatus] = useState<any>(null);
  const [statusReason, setStatusReason] = useState("");

  const { data: fullSchedule, isLoading } = trpc.schedule.getFullSchedule.useQuery();
  
  // Obter semana e ano atuais
  const currentWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);
  const currentYear = new Date().getFullYear();
  
  // Carregar status das aulas da semana
  const { data: weekStatuses } = trpc.classStatus.getWeek.useQuery({
    weekNumber: currentWeek,
    year: currentYear,
  });
  const utils = trpc.useUtils();

  const createMutation = trpc.schedule.create.useMutation({
    onSuccess: () => {
      utils.schedule.getFullSchedule.invalidate();
      toast.success("Aula agendada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao agendar aula: " + error.message);
    },
  });

  const deleteMutation = trpc.schedule.delete.useMutation({
    onSuccess: () => {
      utils.schedule.getFullSchedule.invalidate();
      toast.success("Aula removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover aula: " + error.message);
    },
  });

  const setStatusMutation = trpc.classStatus.set.useMutation({
    onSuccess: () => {
      utils.classStatus.getWeek.invalidate();
      toast.success("Status da aula atualizado!");
      setIsStatusDialogOpen(false);
      setStatusReason("");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const handleSetStatus = (scheduledClass: any, status: 'given' | 'not_given' | 'cancelled') => {
    if (status === 'given') {
      // Marcar como dada diretamente
      setStatusMutation.mutate({
        scheduledClassId: scheduledClass.id,
        weekNumber: currentWeek,
        year: currentYear,
        status: 'given',
      });
    } else {
      // Abrir dialog para adicionar motivo
      setSelectedClassForStatus({ ...scheduledClass, status });
      setIsStatusDialogOpen(true);
    }
  };

  const handleConfirmStatus = () => {
    if (!selectedClassForStatus) return;
    
    setStatusMutation.mutate({
      scheduledClassId: selectedClassForStatus.id,
      weekNumber: currentWeek,
      year: currentYear,
      status: selectedClassForStatus.status,
      reason: statusReason || undefined,
    });
  };

  const getClassStatus = (scheduledClassId: number) => {
    return weekStatuses?.find(s => s.scheduledClassId === scheduledClassId);
  };

  const resetForm = () => {
    setFormData({ subjectId: "", classId: "", timeSlotId: "", dayOfWeek: "", notes: "" });
    setSelectedSlot(null);
    setIsDialogOpen(false);
  };

  const handleOpenDialog = (timeSlotId: number, dayOfWeek: number) => {
    setFormData({ ...formData, timeSlotId: timeSlotId.toString(), dayOfWeek: dayOfWeek.toString() });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      subjectId: parseInt(formData.subjectId),
      classId: parseInt(formData.classId),
      timeSlotId: parseInt(formData.timeSlotId),
      dayOfWeek: parseInt(formData.dayOfWeek),
      notes: formData.notes || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta aula?")) {
      deleteMutation.mutate({ id });
    }
  };

  const scheduleMap = useMemo(() => {
    if (!fullSchedule) return new Map();
    const map = new Map();
    fullSchedule.scheduledClasses.forEach((sc) => {
      const key = `${sc.timeSlotId}-${sc.dayOfWeek}`;
      map.set(key, sc);
    });
    return map;
  }, [fullSchedule]);

  const getScheduledClass = (timeSlotId: number, dayOfWeek: number) => {
    const scheduledClass = scheduleMap.get(`${timeSlotId}-${dayOfWeek}`);
    if (!scheduledClass) return null;
    
    // Aplicar filtros
    if (filterSubjectId && filterSubjectId !== "all" && scheduledClass.subjectId !== parseInt(filterSubjectId)) {
      return null;
    }
    if (filterClassId && filterClassId !== "all" && scheduledClass.classId !== parseInt(filterClassId)) {
      return null;
    }
    
    return scheduledClass;
  };

  const clearFilters = () => {
    setFilterSubjectId("all");
    setFilterClassId("all");
    setFilterShiftId("all");
  };

  const exportToPDF = () => {
    if (!fullSchedule) {
      toast.error("Nenhuma aula para exportar");
      return;
    }

    // Criar conteúdo HTML para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Erro ao abrir janela de impressão");
      return;
    }

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grade de Horários</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #7c3aed; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #7c3aed; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .shift-header { background-color: #e9d5ff; font-weight: bold; padding: 8px; margin-top: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Grade de Horários</h1>
        <p style="text-align: center;">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
    `;

    fullSchedule.shifts.forEach(shift => {
      const shiftSlots = fullSchedule.timeSlots.filter(slot => slot.shiftId === shift.id);
      if (shiftSlots.length === 0) return;

      htmlContent += `<div class="shift-header">${shift.name}</div>`;
      htmlContent += '<table><thead><tr><th>Horário</th>';
      
      DAYS_OF_WEEK.forEach(day => {
        htmlContent += `<th>${day.name}</th>`;
      });
      
      htmlContent += '</tr></thead><tbody>';

      shiftSlots.forEach(slot => {
        htmlContent += `<tr><td><strong>${slot.startTime} - ${slot.endTime}</strong></td>`;
        
        DAYS_OF_WEEK.forEach(day => {
          const scheduledClass = fullSchedule.scheduledClasses.find(
            sc => sc.timeSlotId === slot.id && sc.dayOfWeek === day.id
          );
          
          if (scheduledClass) {
            const subject = fullSchedule.subjects.find(s => s.id === scheduledClass.subjectId);
            const classInfo = fullSchedule.classes.find(c => c.id === scheduledClass.classId);
            htmlContent += `<td><strong>${subject?.code || ''}</strong><br/>${classInfo?.name || ''}</td>`;
          } else {
            htmlContent += '<td>-</td>';
          }
        });
        
        htmlContent += '</tr>';
      });
      
      htmlContent += '</tbody></table>';
    });

    htmlContent += `
        <div style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #7c3aed; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Imprimir / Salvar como PDF</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success("Abrindo visualização para impressão/PDF");
  };

  const exportToExcel = () => {
    if (!fullSchedule) {
      toast.error("Nenhuma aula para exportar");
      return;
    }

    // Criar conteúdo CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Turno,Horário,Segunda,Terça,Quarta,Quinta,Sexta,Sábado\n";

    fullSchedule.shifts.forEach(shift => {
      const shiftSlots = fullSchedule.timeSlots.filter(slot => slot.shiftId === shift.id);
      if (shiftSlots.length === 0) return;

      shiftSlots.forEach(slot => {
        let row = `${shift.name},"${slot.startTime} - ${slot.endTime}"`;
        
        DAYS_OF_WEEK.forEach(day => {
          const scheduledClass = fullSchedule.scheduledClasses.find(
            sc => sc.timeSlotId === slot.id && sc.dayOfWeek === day.id
          );
          
          if (scheduledClass) {
            const subject = fullSchedule.subjects.find(s => s.id === scheduledClass.subjectId);
            const classInfo = fullSchedule.classes.find(c => c.id === scheduledClass.classId);
            row += `,"${subject?.code || ''} - ${classInfo?.name || ''}"`;  
          } else {
            row += ',"-"';
          }
        });
        
        csvContent += row + "\n";
      });
    });

    // Download do arquivo CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grade_horarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Grade exportada para Excel/CSV com sucesso!");
  };

  const exportToCalendar = () => {
    if (!fullSchedule) {
      toast.error("Nenhuma aula para exportar");
      return;
    }

    const events: EventAttributes[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Encontrar a próxima segunda-feira
    const getNextMonday = () => {
      const date = new Date();
      const day = date.getDay();
      const diff = day === 0 ? 1 : (8 - day); // Se domingo, próxima segunda; senão, dias até segunda
      date.setDate(date.getDate() + diff);
      return date;
    };

    const startDate = getNextMonday();

    // Gerar eventos para as próximas 16 semanas (1 semestre)
    for (let week = 0; week < 16; week++) {
      fullSchedule.scheduledClasses.forEach((sc) => {
        const subject = fullSchedule.subjects.find(s => s.id === sc.subjectId);
        const classInfo = fullSchedule.classes.find(c => c.id === sc.classId);
        const timeSlot = fullSchedule.timeSlots.find(ts => ts.id === sc.timeSlotId);
        
        if (!subject || !classInfo || !timeSlot) return;

        // Calcular data do evento (dia da semana + semana)
        const eventDate = new Date(startDate);
        eventDate.setDate(startDate.getDate() + (week * 7) + (sc.dayOfWeek - 1));

        // Parsear horários (formato "HH:MM")
        const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
        const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);

        const start: DateArray = [
          eventDate.getFullYear(),
          eventDate.getMonth() + 1,
          eventDate.getDate(),
          startHour,
          startMinute
        ];

        const end: DateArray = [
          eventDate.getFullYear(),
          eventDate.getMonth() + 1,
          eventDate.getDate(),
          endHour,
          endMinute
        ];

        events.push({
          start,
          end,
          title: `${subject.name} - ${classInfo.name}`,
          description: sc.notes || `Aula de ${subject.name} para a turma ${classInfo.name}`,
          location: classInfo.name,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          categories: ['Aula', subject.name],
        });
      });
    }

    if (events.length === 0) {
      toast.error("Nenhuma aula agendada para exportar");
      return;
    }

    createEvents(events, (error, value) => {
      if (error) {
        console.error(error);
        toast.error("Erro ao gerar arquivo de calendário");
        return;
      }

      // Download do arquivo .ics
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `calendario_aulas_${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Calendário exportado com sucesso! (${events.length} aulas)`);
    });
  };

  const hasActiveFilters = (filterSubjectId !== "" && filterSubjectId !== "all") || (filterClassId !== "" && filterClassId !== "all") || (filterShiftId !== "" && filterShiftId !== "all");

  const getShiftStats = (shiftId: number) => {
    if (!fullSchedule) return { total: 0, occupied: 0, percentage: 0 };
    
    const shiftSlots = fullSchedule.timeSlots.filter(ts => ts.shiftId === shiftId);
    const totalSlots = shiftSlots.length * 6; // 6 dias da semana (Segunda a Sábado)
    
    let occupiedSlots = 0;
    shiftSlots.forEach(slot => {
      DAYS_OF_WEEK.forEach(day => {
        const scheduledClass = scheduleMap.get(`${slot.id}-${day.id}`);
        if (scheduledClass) {
          // Aplicar filtros para contar apenas aulas visíveis
          let isVisible = true;
          if (filterSubjectId && filterSubjectId !== "all" && scheduledClass.subjectId !== parseInt(filterSubjectId)) {
            isVisible = false;
          }
          if (filterClassId && filterClassId !== "all" && scheduledClass.classId !== parseInt(filterClassId)) {
            isVisible = false;
          }
          if (isVisible) occupiedSlots++;
        }
      });
    });
    
    return {
      total: totalSlots,
      occupied: occupiedSlots,
      percentage: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0
    };
  };

  const getSubjectById = (id: number) => {
    return fullSchedule?.subjects.find((s) => s.id === id);
  };

  const getClassById = (id: number) => {
    return fullSchedule?.classes.find((c) => c.id === id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">Carregando grade de horários...</div>
      </div>
    );
  }

  if (!fullSchedule || fullSchedule.shifts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <Card className="bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum turno configurado. Configure os turnos primeiro.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                Grade de Horários
              </h1>
              <div className="flex gap-2">
                <Button
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  PDF
                </Button>
                <Button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <FileSpreadsheet className="mr-2 h-5 w-5" />
                  Excel
                </Button>
                <Button
                  onClick={exportToCalendar}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Calendário
                </Button>
              </div>
            </div>
          </div>

        <Card className="bg-white shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros</span>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-subject">Filtrar por Disciplina</Label>
                <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
                  <SelectTrigger id="filter-subject">
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {fullSchedule?.subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-class">Filtrar por Turma</Label>
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger id="filter-class">
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {fullSchedule?.classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.name} ({classItem.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-shift">Filtrar por Turno</Label>
                <Select value={filterShiftId} onValueChange={setFilterShiftId}>
                  <SelectTrigger id="filter-shift">
                    <SelectValue placeholder="Todos os turnos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os turnos</SelectItem>
                    {fullSchedule?.shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id.toString()}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Filtros ativos:</strong>
                  {filterSubjectId && filterSubjectId !== "all" && (
                    <span className="ml-2">
                      Disciplina: {fullSchedule?.subjects.find(s => s.id === parseInt(filterSubjectId))?.name}
                    </span>
                  )}
                  {filterClassId && filterClassId !== "all" && (
                    <span className="ml-2">
                      Turma: {fullSchedule?.classes.find(c => c.id === parseInt(filterClassId))?.name}
                    </span>
                  )}
                  {filterShiftId && filterShiftId !== "all" && (
                    <span className="ml-2">
                      Turno: {fullSchedule?.shifts.find(s => s.id === parseInt(filterShiftId))?.name}
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {fullSchedule.shifts.map((shift) => {
            // Aplicar filtro de turno
            if (filterShiftId && filterShiftId !== "all" && shift.id !== parseInt(filterShiftId)) {
              return null;
            }
            
            const shiftSlots = fullSchedule.timeSlots.filter((ts) => ts.shiftId === shift.id);
            const stats = getShiftStats(shift.id);
            
            return (
              <Card key={shift.id} className="bg-white shadow-lg overflow-hidden">
                <CardHeader style={{ backgroundColor: shift.color }} className="text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{shift.name}</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm opacity-90">Aulas Agendadas</div>
                        <div className="text-xl font-bold">{stats.occupied} / {stats.total}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-90">Ocupação</div>
                        <div className="text-xl font-bold">{stats.percentage}%</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-3 text-left font-semibold min-w-[100px]">TEMPO</th>
                          <th className="border border-gray-300 p-3 text-left font-semibold min-w-[120px]">HORÁRIO</th>
                          {DAYS_OF_WEEK.map((day) => (
                            <th key={day.id} className="border border-gray-300 p-3 text-center font-semibold min-w-[150px]">
                              {day.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shiftSlots.map((slot) => (
                          <tr key={slot.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-3 font-medium text-center">
                              {slot.slotNumber}
                            </td>
                            <td className="border border-gray-300 p-3 text-sm">
                              {slot.startTime} - {slot.endTime}
                            </td>
                            {DAYS_OF_WEEK.map((day) => {
                              const scheduledClass = getScheduledClass(slot.id, day.id);
                              const subject = scheduledClass ? getSubjectById(scheduledClass.subjectId) : null;
                              const classInfo = scheduledClass ? getClassById(scheduledClass.classId) : null;

                              return (
                                <td key={day.id} className="border border-gray-300 p-2">
                                  {scheduledClass ? (
                                    <div
                                      className="rounded p-2 text-white text-sm relative group cursor-pointer"
                                      style={{ backgroundColor: subject?.color || "#3b82f6" }}
                                    >
                                      <div className="font-semibold">{subject?.name}</div>
                                      <div className="text-xs opacity-90">{classInfo?.name}</div>
                                      {scheduledClass.notes && (
                                        <div className="text-xs opacity-80 mt-1">{scheduledClass.notes}</div>
                                      )}
                                      

                                      {/* Botão de Deletar */}
                                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                        <button
                                          onClick={() => handleDelete(scheduledClass.id)}
                                          className="bg-red-500 hover:bg-red-600 rounded p-1 transition-colors"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenDialog(slot.id, day.id)}
                                      className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Aula</DialogTitle>
              <DialogDescription>
                Selecione a disciplina e a turma para agendar a aula.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Disciplina</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {fullSchedule?.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Turma</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData({ ...formData, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {fullSchedule?.classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                          {classItem.name} ({classItem.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações sobre a aula"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.subjectId || !formData.classId}>
                  Agendar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Status de Aula */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedClassForStatus?.status === 'not_given' ? 'Marcar Aula como Não Dada' : 'Marcar Aula como Cancelada'}
              </DialogTitle>
              <DialogDescription>
                Adicione um motivo opcional para esta marcação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Falta por motivo de saúde, Reunião pedagógica, Feriado municipal..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleConfirmStatus}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
