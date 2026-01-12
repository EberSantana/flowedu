import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import StudentLayout from "@/components/StudentLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Info,
  Circle,
  Printer,
  ArrowLeft,
  BookOpen,
  HelpCircle
} from "lucide-react";
import { toast as showToast } from "sonner";

// Componente de bolha para marcação de resposta (estilo leitura óptica)
function AnswerBubble({ 
  option, 
  selected, 
  onSelect,
  disabled 
}: { 
  option: string; 
  selected: boolean; 
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`
        w-10 h-10 rounded-full border-2 flex items-center justify-center
        font-bold text-lg transition-all duration-200
        ${selected 
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' 
          : 'bg-white border-gray-400 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        print:border-black print:bg-white print:text-black
      `}
    >
      {selected ? <CheckCircle2 className="w-5 h-5" /> : option}
    </button>
  );
}

// Componente de linha de resposta para leitura óptica
function AnswerRow({
  questionNumber,
  options,
  selectedAnswer,
  onAnswerChange,
  disabled
}: {
  questionNumber: number;
  options: string[];
  selectedAnswer?: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-200 hover:bg-gray-50 print:border-gray-400">
      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-lg print:bg-white print:border print:border-black">
        {String(questionNumber).padStart(2, '0')}
      </div>
      <div className="flex gap-3">
        {options.map((option) => (
          <AnswerBubble
            key={option}
            option={option}
            selected={selectedAnswer === option}
            onSelect={() => onAnswerChange(option)}
            disabled={disabled}
          />
        ))}
      </div>
      {selectedAnswer && (
        <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 print:hidden">
          Respondida
        </Badge>
      )}
    </div>
  );
}

// Componente de instruções por tipo de questão
function QuestionTypeInstructions({ 
  type, 
  instructions 
}: { 
  type: string; 
  instructions: { title: string; instructions: string } 
}) {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4 print:bg-white print:border-blue-800">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-800">{instructions.title}</h4>
      </div>
      <div className="text-sm text-blue-700 whitespace-pre-line">
        {instructions.instructions}
      </div>
    </div>
  );
}

export default function StudentAnswerSheet() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [, setLocation] = useLocation();
  
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Buscar caderno de respostas
  // @ts-ignore
  const { data, isLoading, error, refetch } = trpc.answerSheet.getMyAnswerSheet.useQuery(
    { assessmentId: parseInt(assessmentId!) },
    { enabled: !!assessmentId }
  );

  // Iniciar caderno
  // @ts-ignore
  const startMutation = trpc.answerSheet.startAnswerSheet.useMutation({
    onSuccess: () => {
      refetch();
      showToast.success("Caderno iniciado!", { description: "Você pode começar a responder as questões." });
    }
  });

  // Salvar resposta
  // @ts-ignore
  const saveResponseMutation = trpc.answerSheet.saveResponse.useMutation();

  // Submeter caderno
  // @ts-ignore
  const submitMutation = trpc.answerSheet.submitAnswerSheet.useMutation({
    onSuccess: () => {
      showToast.success("Caderno enviado!", { description: "Suas respostas foram registradas com sucesso." });
      setLocation("/student-assessments");
    },
    onError: (error: any) => {
      showToast.error("Erro ao enviar", { description: error.message });
      setIsSubmitting(false);
    }
  });

  // Carregar respostas existentes
  useEffect(() => {
    if (data?.responses) {
      const existingAnswers: Record<number, string> = {};
      data.responses.forEach((r: any) => {
        if (r.studentAnswer) {
          existingAnswers[r.questionId] = r.studentAnswer;
        }
      });
      setAnswers(existingAnswers);
    }
  }, [data?.responses]);

  // Timer
  useEffect(() => {
    if (data?.answerSheet?.status === 'in_progress' && data?.answerSheet?.duration) {
      const startTime = new Date(data.answerSheet.startedAt).getTime();
      const duration = data.answerSheet.duration * 60 * 1000; // minutos para ms
      const endTime = startTime + duration;
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          handleSubmit();
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [data?.answerSheet?.status, data?.answerSheet?.startedAt, data?.answerSheet?.duration]);

  const handleAnswerChange = async (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Salvar automaticamente
    if (data?.answerSheet?.id) {
      saveResponseMutation.mutate({
        answerSheetId: data.answerSheet.id,
        questionId,
        studentAnswer: answer,
        isBlank: false
      });
    }
  };

  const handleStart = () => {
    if (data?.answerSheet?.id) {
      startMutation.mutate({ answerSheetId: data.answerSheet.id });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !data?.answerSheet?.id) return;

    const totalQuestions = data.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `Você ainda tem ${unansweredCount} questão(ões) sem resposta. Deseja enviar mesmo assim?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    submitMutation.mutate({ answerSheetId: data.answerSheet.id });
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando caderno de respostas...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !data) {
    return (
      <StudentLayout>
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar</h2>
                <p className="text-gray-600 mb-4">
                  Não foi possível carregar o caderno de respostas.
                </p>
                <Button onClick={() => setLocation("/student-assessments")}>
                  Voltar para Avaliações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  const { answerSheet, questions, instructions } = data;
  const isStarted = answerSheet?.status === 'in_progress';
  const isSubmitted = answerSheet?.status === 'submitted' || answerSheet?.status === 'corrected';
  const progress = questions?.length ? (Object.keys(answers).length / questions.length) * 100 : 0;

  // Agrupar questões por tipo
  const questionsByType: Record<string, any[]> = {};
  questions?.forEach((q: any) => {
    const type = q.questionType || 'multiple_choice';
    if (!questionsByType[type]) questionsByType[type] = [];
    questionsByType[type].push(q);
  });

  return (
    <StudentLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl print:max-w-none print:py-0">
        {/* Cabeçalho do Caderno */}
        <Card className="mb-6 border-2 border-gray-300 print:border-black print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white print:bg-white print:text-black">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setLocation("/student-assessments")}
                  className="text-white hover:bg-white/20 print:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Caderno de Respostas
                  </CardTitle>
                  <CardDescription className="text-blue-100 print:text-gray-600">
                    {answerSheet?.assessmentTitle}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Informações do Aluno e Avaliação */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border print:bg-white print:border-black">
              <div>
                <p className="text-xs text-gray-500 uppercase">Código do Caderno</p>
                <p className="font-mono font-bold text-lg">{answerSheet?.sheetCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Disciplina</p>
                <p className="font-semibold">{answerSheet?.subjectName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total de Questões</p>
                <p className="font-semibold">{questions?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Pontuação Máxima</p>
                <p className="font-semibold">{answerSheet?.totalPoints} pontos</p>
              </div>
            </div>

            {/* Timer e Progresso */}
            {isStarted && !isSubmitted && (
              <div className="flex items-center justify-between mb-6 print:hidden">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso: {Object.keys(answers).length} de {questions?.length} respondidas</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                {timeRemaining !== null && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-xl">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status do Caderno */}
            {isSubmitted && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <AlertTitle className="text-green-800">Caderno Enviado</AlertTitle>
                <AlertDescription className="text-green-700">
                  Suas respostas foram registradas. Aguarde a correção do professor.
                  {answerSheet?.totalScore !== null && (
                    <span className="block mt-2 font-semibold">
                      Nota: {answerSheet.totalScore} / {answerSheet.totalPoints} ({answerSheet.percentageScore?.toFixed(1)}%)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instruções Gerais */}
        {showInstructions && !isSubmitted && (
          <Card className="mb-6 border-l-4 border-l-amber-500 print:border-l-amber-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  Instruções Gerais
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowInstructions(false)}
                  className="print:hidden"
                >
                  Ocultar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 space-y-2">
                {answerSheet?.generalInstructions ? (
                  <p className="whitespace-pre-line">{answerSheet.generalInstructions}</p>
                ) : (
                  <>
                    <p>• Leia atentamente cada questão antes de responder.</p>
                    <p>• Marque apenas UMA alternativa por questão.</p>
                    <p>• Preencha completamente a bolha correspondente à sua resposta.</p>
                    <p>• Não faça rasuras. Em caso de erro, solicite um novo caderno.</p>
                    <p>• Suas respostas são salvas automaticamente.</p>
                    <p>• Ao finalizar, clique em "Enviar Caderno" para confirmar.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Iniciar (se ainda não iniciou) */}
        {!isStarted && !isSubmitted && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Pronto para começar?</h3>
                <p className="text-gray-600 mb-6">
                  Ao iniciar, o tempo começará a contar{answerSheet?.duration ? ` (${answerSheet.duration} minutos)` : ''}.
                  Certifique-se de estar em um ambiente tranquilo.
                </p>
                <Button 
                  size="lg" 
                  onClick={handleStart}
                  disabled={startMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {startMutation.isPending ? "Iniciando..." : "Iniciar Avaliação"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questões agrupadas por tipo */}
        {isStarted && !isSubmitted && Object.entries(questionsByType).map(([type, typeQuestions]) => (
          <Card key={type} className="mb-6 print:break-inside-avoid">
            <CardHeader className="bg-gray-50 print:bg-white">
              {/* Instruções específicas do tipo */}
              {instructions && instructions[type as keyof typeof instructions] && (
                <QuestionTypeInstructions 
                  type={type} 
                  instructions={instructions[type as keyof typeof instructions]} 
                />
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Grade de Respostas (estilo leitura óptica) */}
              {type === 'multiple_choice' || type === 'true_false' ? (
                <div className="divide-y divide-gray-200">
                  {typeQuestions.map((question: any) => (
                    <div key={question.id} className="print:break-inside-avoid">
                      {/* Enunciado da questão */}
                      <div className="p-4 bg-white">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-purple-600 text-white shrink-0">
                            {question.questionNumber}
                          </Badge>
                          <div className="flex-1">
                            {question.context && (
                              <p className="text-sm text-gray-600 mb-2 italic">{question.context}</p>
                            )}
                            <p className="text-gray-900 font-medium">{question.statement}</p>
                            
                            {/* Alternativas */}
                            {type === 'multiple_choice' && (
                              <div className="mt-3 space-y-2">
                                {question.optionA && <p className="text-sm"><strong>A)</strong> {question.optionA}</p>}
                                {question.optionB && <p className="text-sm"><strong>B)</strong> {question.optionB}</p>}
                                {question.optionC && <p className="text-sm"><strong>C)</strong> {question.optionC}</p>}
                                {question.optionD && <p className="text-sm"><strong>D)</strong> {question.optionD}</p>}
                                {question.optionE && <p className="text-sm"><strong>E)</strong> {question.optionE}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Linha de marcação */}
                      <AnswerRow
                        questionNumber={question.questionNumber}
                        options={type === 'true_false' ? ['V', 'F'] : ['A', 'B', 'C', 'D', 'E'].filter((_, i) => {
                          const opts = [question.optionA, question.optionB, question.optionC, question.optionD, question.optionE];
                          return opts[i];
                        })}
                        selectedAnswer={answers[question.id]}
                        onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Questões dissertativas/abertas */
                <div className="p-4 space-y-6">
                  {typeQuestions.map((question: any) => (
                    <div key={question.id} className="border rounded-lg p-4 print:break-inside-avoid">
                      <div className="flex items-start gap-3 mb-4">
                        <Badge className="bg-purple-600 text-white shrink-0">
                          {question.questionNumber}
                        </Badge>
                        <div className="flex-1">
                          {question.context && (
                            <p className="text-sm text-gray-600 mb-2 italic">{question.context}</p>
                          )}
                          <p className="text-gray-900 font-medium">{question.statement}</p>
                        </div>
                        <Badge variant="outline">{question.points} pts</Badge>
                      </div>
                      
                      <textarea
                        className="w-full min-h-[150px] p-3 border rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Digite sua resposta aqui..."
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Botão Enviar */}
        {isStarted && !isSubmitted && (
          <Card className="print:hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Questões respondidas: <strong>{Object.keys(answers).length}</strong> de <strong>{questions?.length}</strong></p>
                  {Object.keys(answers).length < (questions?.length || 0) && (
                    <p className="text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      Você ainda tem questões em branco
                    </p>
                  )}
                </div>
                <Button 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Enviando..." : "Enviar Caderno"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado após correção */}
        {isSubmitted && answerSheet?.status === 'corrected' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Resultado da Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{answerSheet.correctAnswers}</p>
                  <p className="text-sm text-gray-600">Acertos</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{answerSheet.wrongAnswers}</p>
                  <p className="text-sm text-gray-600">Erros</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-600">{answerSheet.blankAnswers}</p>
                  <p className="text-sm text-gray-600">Em Branco</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{answerSheet.percentageScore?.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Aproveitamento</p>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <p className="text-lg">
                  Nota Final: <strong className="text-2xl">{answerSheet.totalScore}</strong> / {answerSheet.totalPoints} pontos
                </p>
                {answerSheet.percentageScore >= answerSheet.passingScore ? (
                  <Badge className="mt-2 bg-green-600">Aprovado</Badge>
                ) : (
                  <Badge className="mt-2 bg-red-600">Abaixo da média</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
