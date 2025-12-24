import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle, Trophy, Flame } from "lucide-react";

interface Exercise {
  id: number;
  number: number;
  type: "objective" | "subjective" | "case_study";
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  caseContext?: string;
  caseQuestions?: string[];
}

interface StudentExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  moduleId: number;
  moduleTitle: string;
}

export default function StudentExerciseModal({
  isOpen,
  onClose,
  exercises,
  moduleId,
  moduleTitle,
}: StudentExerciseModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedExercises, setSubmittedExercises] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  const currentExercise = exercises[currentIndex];

  const submitObjectiveMutation = trpc.exerciseSubmission.submitObjective.useMutation({
    onSuccess: (data) => {
      setSubmittedExercises(prev => new Set(prev).add(currentExercise.id));
      setTotalPoints(prev => prev + data.points);
      
      if (data.isCorrect) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-bold">Resposta Correta!</div>
              <div className="text-sm">+{data.points} pontos 🎉</div>
            </div>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.error("Resposta incorreta. Tente novamente!");
      }
    },
    onError: (error) => {
      toast.error("Erro ao enviar resposta: " + error.message);
    },
  });

  const submitSubjectiveMutation = trpc.exerciseSubmission.submitSubjective.useMutation({
    onSuccess: (data) => {
      setSubmittedExercises(prev => new Set(prev).add(currentExercise.id));
      setTotalPoints(prev => prev + data.points);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          <div>
            <div className="font-bold">Resposta Enviada!</div>
            <div className="text-sm">+{data.points} pontos 🎉</div>
          </div>
        </div>,
        { duration: 3000 }
      );
    },
    onError: (error) => {
      toast.error("Erro ao enviar resposta: " + error.message);
    },
  });

  const submitCaseStudyMutation = trpc.exerciseSubmission.submitCaseStudy.useMutation({
    onSuccess: (data) => {
      setSubmittedExercises(prev => new Set(prev).add(currentExercise.id));
      setTotalPoints(prev => prev + data.points);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-600" />
          <div>
            <div className="font-bold">Estudo de Caso Concluído!</div>
            <div className="text-sm">+{data.points} pontos 🔥</div>
          </div>
        </div>,
        { duration: 3000 }
      );
    },
    onError: (error) => {
      toast.error("Erro ao enviar resposta: " + error.message);
    },
  });

  const handleSubmitAnswer = () => {
    const answer = answers[currentExercise.id];
    
    if (!answer || answer.trim() === "") {
      toast.error("Por favor, selecione ou escreva uma resposta!");
      return;
    }

    if (currentExercise.type === "objective") {
      submitObjectiveMutation.mutate({
        exerciseId: currentExercise.id,
        selectedAnswer: answer,
        correctAnswer: currentExercise.correctAnswer || "",
        moduleId,
      });
    } else if (currentExercise.type === "subjective") {
      submitSubjectiveMutation.mutate({
        exerciseId: currentExercise.id,
        answer,
        moduleId,
      });
    } else if (currentExercise.type === "case_study") {
      submitCaseStudyMutation.mutate({
        exerciseId: currentExercise.id,
        answer,
        moduleId,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isSubmitting = 
    submitObjectiveMutation.isPending || 
    submitSubjectiveMutation.isPending || 
    submitCaseStudyMutation.isPending;

  const isCurrentSubmitted = submittedExercises.has(currentExercise.id);

  const handleClose = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSubmittedExercises(new Set());
    setShowResults(false);
    setTotalPoints(0);
    onClose();
  };

  if (showResults) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Exercícios Concluídos!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalPoints} Pontos</h3>
            <p className="text-gray-600 mb-4">Você completou {submittedExercises.size} de {exercises.length} exercícios!</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              Continue praticando para subir de faixa! 🥋
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Exercícios - {moduleTitle}</span>
            <span className="text-sm font-normal text-gray-600">
              {currentIndex + 1} de {exercises.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Indicador de Progresso */}
            <div className="flex gap-2 justify-center mb-6">
              {exercises.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 w-8 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-blue-600"
                      : submittedExercises.has(exercises[idx].id)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Exercício Atual */}
            <div className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">
                  Exercício {currentExercise.number}
                </span>
                <span className={`text-sm px-3 py-1 rounded font-medium ${
                  currentExercise.type === "objective"
                    ? "bg-blue-100 text-blue-700"
                    : currentExercise.type === "subjective"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-orange-100 text-orange-700"
                }`}>
                  {currentExercise.type === "objective"
                    ? "Objetiva"
                    : currentExercise.type === "subjective"
                    ? "Subjetiva"
                    : "Estudo de Caso"}
                </span>
              </div>

              {currentExercise.caseContext && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 text-base italic text-gray-700 leading-relaxed">
                  {currentExercise.caseContext}
                </div>
              )}

              <p className="mb-4 text-base text-gray-800 leading-relaxed">
                {currentExercise.question}
              </p>

              {/* Opções (Objetiva) */}
              {currentExercise.type === "objective" && currentExercise.options && (
                <RadioGroup
                  value={answers[currentExercise.id] || ""}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [currentExercise.id]: value })
                  }
                  disabled={isCurrentSubmitted}
                  className="space-y-3"
                >
                  {currentExercise.options.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.charAt(0)} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="text-base cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Textarea (Subjetiva e Estudo de Caso) */}
              {(currentExercise.type === "subjective" || currentExercise.type === "case_study") && (
                <Textarea
                  value={answers[currentExercise.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [currentExercise.id]: e.target.value })
                  }
                  disabled={isCurrentSubmitted}
                  placeholder="Digite sua resposta aqui..."
                  className="min-h-[150px] text-base"
                />
              )}

              {/* Feedback após submissão */}
              {isCurrentSubmitted && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                    <CheckCircle className="h-5 w-5" />
                    Resposta Enviada!
                  </div>
                  {currentExercise.explanation && (
                    <p className="text-sm text-gray-700">
                      <strong>Explicação:</strong> {currentExercise.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 border-t pt-4 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </Button>

          <div className="flex gap-2">
            {!isCurrentSubmitted && (
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answers[currentExercise.id]}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar Resposta
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!isCurrentSubmitted}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentIndex === exercises.length - 1 ? "Finalizar" : "Próximo →"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
