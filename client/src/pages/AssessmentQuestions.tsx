import { useState } from "react";
import { useParams, useLocation } from "wouter";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Plus, 
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  GripVertical,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface QuestionForm {
  questionNumber: number;
  questionType: 'multiple_choice' | 'true_false' | 'matching' | 'fill_blank' | 'short_answer' | 'essay';
  statement: string;
  context: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  answerExplanation: string;
  specificInstructions: string;
  points: number;
  skill: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const defaultQuestion: QuestionForm = {
  questionNumber: 1,
  questionType: 'multiple_choice',
  statement: '',
  context: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  correctAnswer: '',
  answerExplanation: '',
  specificInstructions: '',
  points: 10,
  skill: '',
  difficulty: 'medium'
};

export default function AssessmentQuestions() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [, setLocation] = useLocation();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [formData, setFormData] = useState<QuestionForm>(defaultQuestion);

  // Queries
  // @ts-ignore
  const { data: assessment, isLoading, refetch } = trpc.answerSheet.getAssessment.useQuery(
    { assessmentId: parseInt(assessmentId!) },
    { enabled: !!assessmentId }
  );

  // Mutations
  // @ts-ignore
  const addQuestionMutation = trpc.answerSheet.addQuestion.useMutation({
    onSuccess: () => {
      toast.success("Questão adicionada!");
      setIsAddOpen(false);
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar questão", { description: error.message });
    }
  });

  // @ts-ignore
  const updateQuestionMutation = trpc.answerSheet.updateQuestion.useMutation({
    onSuccess: () => {
      toast.success("Questão atualizada!");
      setEditingQuestion(null);
      refetch();
    }
  });

  // @ts-ignore
  const deleteQuestionMutation = trpc.answerSheet.deleteQuestion.useMutation({
    onSuccess: () => {
      toast.success("Questão excluída!");
      refetch();
    }
  });

  const resetForm = () => {
    const nextNumber = (assessment?.questions?.length || 0) + 1;
    setFormData({ ...defaultQuestion, questionNumber: nextNumber });
  };

  const handleAdd = () => {
    if (!formData.statement || !formData.correctAnswer) {
      toast.error("Preencha o enunciado e a resposta correta");
      return;
    }
    addQuestionMutation.mutate({
      assessmentId: parseInt(assessmentId!),
      ...formData
    });
  };

  const handleUpdate = () => {
    if (!editingQuestion) return;
    updateQuestionMutation.mutate({
      questionId: editingQuestion.id,
      ...formData
    });
  };

  const handleDelete = (questionId: number) => {
    if (confirm("Tem certeza que deseja excluir esta questão?")) {
      deleteQuestionMutation.mutate({ questionId });
    }
  };

  const openEdit = (question: any) => {
    setFormData({
      questionNumber: question.questionNumber,
      questionType: question.questionType,
      statement: question.statement || '',
      context: question.context || '',
      optionA: question.optionA || '',
      optionB: question.optionB || '',
      optionC: question.optionC || '',
      optionD: question.optionD || '',
      optionE: question.optionE || '',
      correctAnswer: question.correctAnswer || '',
      answerExplanation: question.answerExplanation || '',
      specificInstructions: question.specificInstructions || '',
      points: question.points || 10,
      skill: question.skill || '',
      difficulty: question.difficulty || 'medium'
    });
    setEditingQuestion(question);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-100 text-green-700">Fácil</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Média</Badge>;
      case 'hard':
        return <Badge className="bg-red-100 text-red-700">Difícil</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      multiple_choice: "Múltipla Escolha",
      true_false: "Verdadeiro/Falso",
      matching: "Associação",
      fill_blank: "Preencher Lacunas",
      short_answer: "Resposta Curta",
      essay: "Dissertativa"
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const QuestionFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Número</Label>
          <Input
            type="number"
            min={1}
            value={formData.questionNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, questionNumber: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div>
          <Label>Tipo de Questão</Label>
          <Select
            value={formData.questionType}
            onValueChange={(v: any) => setFormData(prev => ({ ...prev, questionType: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
              <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
              <SelectItem value="matching">Associação</SelectItem>
              <SelectItem value="fill_blank">Preencher Lacunas</SelectItem>
              <SelectItem value="short_answer">Resposta Curta</SelectItem>
              <SelectItem value="essay">Dissertativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Dificuldade</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(v: any) => setFormData(prev => ({ ...prev, difficulty: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Contexto (opcional)</Label>
        <Textarea
          value={formData.context}
          onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
          placeholder="Texto de apoio, citação ou situação-problema..."
          rows={2}
        />
      </div>

      <div>
        <Label>Enunciado *</Label>
        <Textarea
          value={formData.statement}
          onChange={(e) => setFormData(prev => ({ ...prev, statement: e.target.value }))}
          placeholder="Digite o enunciado da questão..."
          rows={3}
        />
      </div>

      {(formData.questionType === 'multiple_choice') && (
        <div className="space-y-3">
          <Label>Alternativas</Label>
          <div className="grid gap-2">
            {['A', 'B', 'C', 'D', 'E'].map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm">
                  {letter}
                </span>
                <Input
                  value={(formData as any)[`option${letter}`]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`option${letter}`]: e.target.value }))}
                  placeholder={`Alternativa ${letter}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Resposta Correta *</Label>
          {formData.questionType === 'multiple_choice' ? (
            <Select
              value={formData.correctAnswer}
              onValueChange={(v) => setFormData(prev => ({ ...prev, correctAnswer: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                  <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : formData.questionType === 'true_false' ? (
            <Select
              value={formData.correctAnswer}
              onValueChange={(v) => setFormData(prev => ({ ...prev, correctAnswer: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V">Verdadeiro</SelectItem>
                <SelectItem value="F">Falso</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={formData.correctAnswer}
              onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
              placeholder="Digite a resposta correta..."
            />
          )}
        </div>
        <div>
          <Label>Pontuação</Label>
          <Input
            type="number"
            min={1}
            value={formData.points}
            onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
          />
        </div>
      </div>

      <div>
        <Label>Explicação da Resposta (opcional)</Label>
        <Textarea
          value={formData.answerExplanation}
          onChange={(e) => setFormData(prev => ({ ...prev, answerExplanation: e.target.value }))}
          placeholder="Explicação que será mostrada após a correção..."
          rows={2}
        />
      </div>

      <div>
        <Label>Habilidade Avaliada (opcional)</Label>
        <Input
          value={formData.skill}
          onChange={(e) => setFormData(prev => ({ ...prev, skill: e.target.value }))}
          placeholder="Ex: Resolver equações do 2º grau"
        />
      </div>

      <div>
        <Label>Instruções Específicas (opcional)</Label>
        <Textarea
          value={formData.specificInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, specificInstructions: e.target.value }))}
          placeholder="Instruções específicas para esta questão..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => setLocation("/assessments")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {assessment?.title}
            </h1>
            <p className="text-gray-600">
              {assessment?.subjectName} • {assessment?.totalQuestions} questões • {assessment?.totalPoints} pontos
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Questão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Questão</DialogTitle>
              </DialogHeader>
              <QuestionFormFields />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={addQuestionMutation.isPending}>
                  {addQuestionMutation.isPending ? "Salvando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dicas */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Dicas para criar boas questões:</strong>
            <ul className="list-disc ml-4 mt-1 text-sm">
              <li>Cada questão deve avaliar apenas uma habilidade específica</li>
              <li>O enunciado deve ser claro e sem ambiguidades</li>
              <li>As alternativas devem ser plausíveis e homogêneas</li>
              <li>Evite alternativas como "todas as anteriores" ou "nenhuma das anteriores"</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Lista de Questões */}
        {assessment?.questions?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhuma questão cadastrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Adicione questões para compor sua avaliação.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessment?.questions?.map((question: any, index: number) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-lg">
                        {String(question.questionNumber).padStart(2, '0')}
                      </div>
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{getTypeLabel(question.questionType)}</Badge>
                        {getDifficultyBadge(question.difficulty)}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {question.points} pts
                        </Badge>
                        {question.skill && (
                          <Badge variant="outline" className="bg-gray-50">
                            {question.skill}
                          </Badge>
                        )}
                      </div>
                      
                      {question.context && (
                        <p className="text-sm text-gray-600 italic mb-2 p-2 bg-gray-50 rounded">
                          {question.context}
                        </p>
                      )}
                      
                      <p className="text-gray-900 mb-3">{question.statement}</p>
                      
                      {question.questionType === 'multiple_choice' && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                            const optionValue = question[`option${letter}`];
                            if (!optionValue) return null;
                            const isCorrect = question.correctAnswer === letter;
                            return (
                              <div 
                                key={letter}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                <span className={`font-bold ${isCorrect ? 'text-green-700' : 'text-gray-600'}`}>
                                  {letter})
                                </span>
                                <span className={isCorrect ? 'text-green-700' : 'text-gray-700'}>
                                  {optionValue}
                                </span>
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.questionType === 'true_false' && (
                        <div className="flex gap-4 text-sm">
                          <span className={`px-3 py-1 rounded ${
                            question.correctAnswer === 'V' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'
                          }`}>
                            Verdadeiro
                          </span>
                          <span className={`px-3 py-1 rounded ${
                            question.correctAnswer === 'F' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'
                          }`}>
                            Falso
                          </span>
                        </div>
                      )}
                      
                      {question.answerExplanation && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Explicação:</strong> {question.answerExplanation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Questão {formData.questionNumber}</DialogTitle>
            </DialogHeader>
            <QuestionFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateQuestionMutation.isPending}>
                {updateQuestionMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
