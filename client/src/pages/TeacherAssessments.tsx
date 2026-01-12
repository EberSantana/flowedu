import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Plus, 
  Clock, 
  Calendar, 
  Search,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Users,
  BarChart3,
  Send,
  Archive
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherAssessments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: 0,
    classId: undefined as number | undefined,
    assessmentType: "prova" as const,
    totalQuestions: 10,
    totalPoints: 100,
    passingScore: 60,
    duration: 60,
    generalInstructions: "",
  });

  // Queries
  // @ts-ignore
  const { data: assessments, isLoading, refetch } = trpc.answerSheet.listAssessments.useQuery(
    selectedSubject ? { subjectId: parseInt(selectedSubject) } : undefined
  );
  // @ts-ignore
  const { data: subjects } = trpc.subjects.list.useQuery();

  // Mutations
  // @ts-ignore
  const createMutation = trpc.answerSheet.createAssessment.useMutation({
    onSuccess: () => {
      toast.success("Avaliação criada com sucesso!");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar avaliação", { description: error.message });
    }
  });

  // @ts-ignore
  const updateMutation = trpc.answerSheet.updateAssessment.useMutation({
    onSuccess: () => {
      toast.success("Avaliação atualizada!");
      refetch();
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subjectId: 0,
      classId: undefined,
      assessmentType: "prova",
      totalQuestions: 10,
      totalPoints: 100,
      passingScore: 60,
      duration: 60,
      generalInstructions: "",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.subjectId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  const handlePublish = (assessmentId: number) => {
    updateMutation.mutate({ assessmentId, status: 'published' });
  };

  const handleArchive = (assessmentId: number) => {
    updateMutation.mutate({ assessmentId, status: 'archived' });
  };

  const filteredAssessments = assessments?.filter((a: any) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100">Rascunho</Badge>;
      case 'published':
        return <Badge className="bg-green-600">Publicada</Badge>;
      case 'applied':
        return <Badge className="bg-blue-600">Aplicada</Badge>;
      case 'corrected':
        return <Badge className="bg-purple-600">Corrigida</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-200 text-gray-600">Arquivada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      prova: "Prova",
      simulado: "Simulado",
      avaliacao_parcial: "Avaliação Parcial",
      avaliacao_final: "Avaliação Final",
      recuperacao: "Recuperação",
      diagnostica: "Diagnóstica"
    };
    return types[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Avaliações
            </h1>
            <p className="text-gray-600 mt-2">
              Crie e gerencie provas, simulados e avaliações
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Avaliação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Prova Bimestral de Matemática"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="subject">Disciplina *</Label>
                    <Select
                      value={formData.subjectId ? String(formData.subjectId) : ""}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, subjectId: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Tipo de Avaliação</Label>
                    <Select
                      value={formData.assessmentType}
                      onValueChange={(v: any) => setFormData(prev => ({ ...prev, assessmentType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prova">Prova</SelectItem>
                        <SelectItem value="simulado">Simulado</SelectItem>
                        <SelectItem value="avaliacao_parcial">Avaliação Parcial</SelectItem>
                        <SelectItem value="avaliacao_final">Avaliação Final</SelectItem>
                        <SelectItem value="recuperacao">Recuperação</SelectItem>
                        <SelectItem value="diagnostica">Diagnóstica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="questions">Nº de Questões</Label>
                    <Input
                      id="questions"
                      type="number"
                      min={1}
                      value={formData.totalQuestions}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="points">Pontuação Total</Label>
                    <Input
                      id="points"
                      type="number"
                      min={1}
                      value={formData.totalPoints}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalPoints: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="passing">Nota Mínima (%)</Label>
                    <Input
                      id="passing"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.passingScore}
                      onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 60 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={1}
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional da avaliação..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="instructions">Instruções Gerais</Label>
                    <Textarea
                      id="instructions"
                      value={formData.generalInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, generalInstructions: e.target.value }))}
                      placeholder="Instruções que aparecerão no início do caderno de respostas..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Avaliação"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar avaliação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as disciplinas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as disciplinas</SelectItem>
              {subjects?.map((s: any) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Avaliações */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAssessments?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhuma avaliação encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie sua primeira avaliação clicando no botão acima.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAssessments?.map((assessment: any) => (
              <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {assessment.title}
                        </h3>
                        {getStatusBadge(assessment.status)}
                        <Badge variant="outline">{getTypeLabel(assessment.assessmentType)}</Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assessment.subjectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assessment.totalQuestions} questões
                        </span>
                        {assessment.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assessment.duration} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {assessment.totalPoints} pontos
                        </span>
                      </div>

                      {assessment.description && (
                        <p className="text-gray-600 text-sm">{assessment.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/assessments/${assessment.id}/questions`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Questões
                      </Button>
                      
                      {assessment.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(assessment.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Publicar
                        </Button>
                      )}
                      
                      {assessment.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/assessments/${assessment.id}/results`)}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Respostas
                        </Button>
                      )}
                      
                      {assessment.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(assessment.id)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
