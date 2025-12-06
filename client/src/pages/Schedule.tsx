import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Calendar, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

const DAYS_OF_WEEK = [
  { id: 1, name: "Segunda-Feira", short: "Seg" },
  { id: 2, name: "Terça-Feira", short: "Ter" },
  { id: 3, name: "Quarta-Feira", short: "Qua" },
  { id: 4, name: "Quinta-Feira", short: "Qui" },
  { id: 5, name: "Sexta-Feira", short: "Sex" },
  { id: 6, name: "Sábado", short: "Sáb" },
  { id: 0, name: "Domingo", short: "Dom" },
];

export default function Schedule() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");
  const [formData, setFormData] = useState({
    subjectId: "",
    classId: "",
    timeSlotId: "",
    dayOfWeek: "",
    notes: "",
  });

  const { data: fullSchedule, isLoading } = trpc.schedule.getFullSchedule.useQuery();
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
  };

  const hasActiveFilters = (filterSubjectId !== "" && filterSubjectId !== "all") || (filterClassId !== "" && filterClassId !== "all");

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              Grade de Horários
            </h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Filtros ativos:</strong>
                  {filterSubjectId && (
                    <span className="ml-2">
                      Disciplina: {fullSchedule?.subjects.find(s => s.id === parseInt(filterSubjectId))?.name}
                    </span>
                  )}
                  {filterClassId && (
                    <span className="ml-2">
                      Turma: {fullSchedule?.classes.find(c => c.id === parseInt(filterClassId))?.name}
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          {fullSchedule.shifts.map((shift) => {
            const shiftSlots = fullSchedule.timeSlots.filter((ts) => ts.shiftId === shift.id);
            
            return (
              <Card key={shift.id} className="bg-white shadow-lg overflow-hidden">
                <CardHeader style={{ backgroundColor: shift.color }} className="text-white">
                  <CardTitle className="text-2xl">{shift.name}</CardTitle>
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
                                      <button
                                        onClick={() => handleDelete(scheduledClass.id)}
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 rounded p-1 transition-opacity"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
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
      </div>
    </div>
  );
}
