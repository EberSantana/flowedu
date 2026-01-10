import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import PageWrapper from "@/components/PageWrapper";

export default function TeacherPracticeQuestions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterBelt, setFilterBelt] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium" as "easy" | "medium" | "hard" | "expert",
    belt: "white" as "white" | "yellow" | "orange" | "green" | "blue" | "purple" | "brown" | "black",
    tags: "",
    expectedAnswer: "",
  });
  
  // Query para listar questões do professor
  const { data: questions, isLoading, refetch } = trpc.practiceQuestions.listByTeacher.useQuery({
    difficulty: filterDifficulty === "all" ? undefined : filterDifficulty,
    belt: filterBelt === "all" ? undefined : filterBelt,
  });
  
  // Mutation para criar questão
  const createQuestion = trpc.practiceQuestions.create.useMutation({
    onSuccess: () => {
      toast.success("Questão criada!", {
        description: "A questão foi adicionada com sucesso.",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar questão", {
        description: error.message,
      });
    },
  });
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "medium",
      belt: "white",
      tags: "",
      expectedAnswer: "",
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuestion.mutate(formData);
  };
  
  // Badge de dificuldade
  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, any> = {
      easy: "default",
      medium: "secondary",
      hard: "destructive",
      expert: "outline",
    };
    
    const labels: Record<string, string> = {
      easy: "Fácil",
      medium: "Médio",
      hard: "Difícil",
      expert: "Expert",
    };
    
    return (
      <Badge variant={variants[difficulty] || "outline"}>
        {labels[difficulty] || difficulty}
      </Badge>
    );
  };
  
  // Badge de faixa
  const getBeltBadge = (belt: string) => {
    const colors: Record<string, string> = {
      white: "bg-gray-100 text-gray-800",
      yellow: "bg-yellow-100 text-yellow-800",
      orange: "bg-orange-100 text-orange-800",
      green: "bg-green-100 text-green-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      brown: "bg-amber-100 text-amber-800",
      black: "bg-gray-800 text-white",
    };
    
    const labels: Record<string, string> = {
      white: "Branca",
      yellow: "Amarela",
      orange: "Laranja",
      green: "Verde",
      blue: "Azul",
      purple: "Roxa",
      brown: "Marrom",
      black: "Preta",
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[belt] || colors.white}`}>
        Faixa {labels[belt] || belt}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <PageWrapper>
        <div className="container mx-auto py-8">
          <p>Carregando questões...</p>
        </div>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Questões de Prática</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie questões para seus alunos praticarem
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Questão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Questão</DialogTitle>
                <DialogDescription>
                  Preencha os dados da questão de prática
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Decomposição de Problemas - Nível 1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Enunciado *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o problema ou desafio que o aluno deve resolver..."
                    rows={6}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Dificuldade</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="belt">Faixa</Label>
                    <Select
                      value={formData.belt}
                      onValueChange={(value: any) => setFormData({ ...formData, belt: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">Branca</SelectItem>
                        <SelectItem value="yellow">Amarela</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="purple">Roxa</SelectItem>
                        <SelectItem value="brown">Marrom</SelectItem>
                        <SelectItem value="black">Preta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="expectedAnswer">Resposta Esperada (Opcional)</Label>
                  <Textarea
                    id="expectedAnswer"
                    value={formData.expectedAnswer}
                    onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })}
                    placeholder="Descreva a resposta esperada para ajudar na correção..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Isso ajudará a IA a gerar dicas mais precisas
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (Opcional)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Ex: decomposição, algoritmos, abstração"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separe as tags por vírgula
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createQuestion.isPending}>
                    {createQuestion.isPending ? "Criando..." : "Criar Questão"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Filtros */}
        <div className="mb-6 flex items-center gap-4">
          <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dificuldade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterBelt} onValueChange={setFilterBelt}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Faixa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="white">Branca</SelectItem>
              <SelectItem value="yellow">Amarela</SelectItem>
              <SelectItem value="orange">Laranja</SelectItem>
              <SelectItem value="green">Verde</SelectItem>
              <SelectItem value="blue">Azul</SelectItem>
              <SelectItem value="purple">Roxa</SelectItem>
              <SelectItem value="brown">Marrom</SelectItem>
              <SelectItem value="black">Preta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Lista de questões */}
        {questions && questions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Você ainda não criou nenhuma questão.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Questão
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questions?.map((question: any) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-2 text-lg">{question.title}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2 mt-2">
                  {getDifficultyBadge(question.difficulty)}
                  {getBeltBadge(question.belt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {question.description}
                </p>
                
                {question.tags && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {question.tags.split(',').slice(0, 3).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mb-4">
                  Criada em {new Date(question.createdAt).toLocaleDateString('pt-BR')}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedQuestion(question)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Modal de detalhes da questão */}
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedQuestion?.title}</DialogTitle>
              <DialogDescription>
                Detalhes da questão e tentativas dos alunos
              </DialogDescription>
            </DialogHeader>
            
            {selectedQuestion && (
              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold mb-2">Enunciado</h3>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded">
                    {selectedQuestion.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Dificuldade: </span>
                    {getDifficultyBadge(selectedQuestion.difficulty)}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Faixa: </span>
                    {getBeltBadge(selectedQuestion.belt)}
                  </div>
                </div>
                
                {selectedQuestion.expectedAnswer && (
                  <div>
                    <h3 className="font-semibold mb-2">Resposta Esperada</h3>
                    <p className="text-sm whitespace-pre-wrap bg-blue-50 dark:bg-blue-950 p-4 rounded">
                      {selectedQuestion.expectedAnswer}
                    </p>
                  </div>
                )}
                
                {selectedQuestion.tags && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuestion.tags.split(',').map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 Os alunos podem visualizar esta questão e enviar suas respostas através do portal do aluno.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
