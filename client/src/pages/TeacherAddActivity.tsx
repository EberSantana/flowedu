import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { Link } from "wouter";

const ACTIVITY_TYPES = [
  { value: "class_taught", label: "Aula Ministrada", points: 10 },
  { value: "planning", label: "Planejamento de Aula", points: 5 },
  { value: "grading", label: "Correção de Atividades", points: 8 },
  { value: "meeting", label: "Reunião Pedagógica", points: 15 },
  { value: "course_creation", label: "Criação de Plano de Curso", points: 50 },
  { value: "material_creation", label: "Criação de Material Didático", points: 25 },
  { value: "student_support", label: "Atendimento a Alunos", points: 12 },
  { value: "professional_dev", label: "Desenvolvimento Profissional", points: 30 },
  { value: "other", label: "Outras Atividades", points: 5 }
];

export function TeacherAddActivity() {
  // Toast já importado do sonner
  const utils = trpc.useUtils();

  const [activityType, setActivityType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);

  const addActivityMutation = trpc.teacherBelt.addActivity.useMutation({
    onSuccess: (data) => {
      toast.success(`Atividade registrada com sucesso!`);

      // Limpar formulário
      setActivityType("");
      setTitle("");
      setDescription("");
      setDuration("");
      setActivityDate(new Date().toISOString().split("T")[0]);
    },
    onError: (error) => {
      toast.error(`Erro ao registrar atividade: ${error.message}`);
    },
  });

  const getPointsForType = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type)?.points || 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityType || !title || !activityDate) {
      toast.error("Preencha tipo, título e data da atividade");
      return;
    }

    addActivityMutation.mutate({
      activityType: activityType as any,
      title,
      description: description || undefined,
      duration: duration ? parseInt(duration) : undefined,
      activityDate,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Registrar Atividade</h1>
          <p className="text-gray-600 mt-2">
            Registre suas atividades profissionais e ganhe pontos para evoluir
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="space-y-6">
            {/* Tipo de Atividade */}
            <div>
              <Label htmlFor="activityType">Tipo de Atividade *</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activityType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} (+{type.points} pontos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aula de Matemática - Turma A"
              />
            </div>

            {/* Data */}
            <div>
              <Label htmlFor="activityDate">Data *</Label>
              <Input
                id="activityDate"
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>

            {/* Duração */}
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes opcionais sobre a atividade..."
                rows={4}
              />
            </div>

            {/* Pontos que serão ganhos */}
            {activityType && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <p className="text-sm text-indigo-800">
                  Você ganhará <span className="font-bold">{getPointsForType(activityType)} pontos</span> ao registrar esta atividade
                </p>
              </div>
            )}

            {/* Botão de Submit */}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={addActivityMutation.isPending}
            >
              {addActivityMutation.isPending ? (
                "Registrando..."
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Atividade
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
