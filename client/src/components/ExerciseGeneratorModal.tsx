import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  Dumbbell,
  CheckSquare,
  MessageSquare,
  Briefcase,
  Shuffle,
  Copy,
  Printer,
  Lightbulb,
} from "lucide-react";

interface ExerciseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  moduleTitle: string;
}

type ExerciseType = "objective" | "subjective" | "case_study" | "mixed";

interface GeneratedExercises {
  moduleTitle: string;
  exercises: Array<{
    number: number;
    type: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    hint?: string;
    explanation?: string;
    caseContext?: string;
    caseQuestions?: string[];
  }>;
}

export default function ExerciseGeneratorModal({
  isOpen,
  onClose,
  moduleId,
  moduleTitle,
}: ExerciseGeneratorModalProps) {
  const [exerciseType, setExerciseType] = useState<ExerciseType>("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedExercises, setGeneratedExercises] = useState<GeneratedExercises | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const generateExercisesMutation = trpc.learningPath.generateModuleExercises.useMutation({
    onSuccess: (data) => {
      setGeneratedExercises(data as GeneratedExercises);
      toast.success("Exercícios gerados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar exercícios: " + error.message);
    },
  });

  const handleGenerate = () => {
    generateExercisesMutation.mutate({
      moduleId,
      exerciseType,
      questionCount,
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("exercises-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Exercícios - ${moduleTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                .exercise { margin-bottom: 20px; page-break-inside: avoid; }
                .options { margin-left: 20px; }
                .hint { color: #2563eb; font-style: italic; }
                .answer { color: #059669; font-weight: bold; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleCopy = () => {
    if (!generatedExercises) return;
    
    let text = `Exercícios - ${generatedExercises.moduleTitle}\n\n`;
    
    generatedExercises.exercises.forEach((ex) => {
      text += `${ex.number}. ${ex.question}\n`;
      if (ex.options) {
        ex.options.forEach((opt) => {
          text += `   ${opt}\n`;
        });
      }
      if (ex.caseContext) {
        text += `   Contexto: ${ex.caseContext}\n`;
      }
      if (ex.caseQuestions) {
        ex.caseQuestions.forEach((cq, idx) => {
          text += `   ${String.fromCharCode(97 + idx)}) ${cq}\n`;
        });
      }
      if (showHints && ex.hint) {
        text += `   💡 Dica: ${ex.hint}\n`;
      }
      if (showAnswers) {
        if (ex.correctAnswer) text += `   ✓ Resposta: ${ex.correctAnswer}\n`;
        if (ex.explanation) text += `   📝 Explicação: ${ex.explanation}\n`;
      }
      text += "\n";
    });
    
    navigator.clipboard.writeText(text);
    toast.success("Exercícios copiados para a área de transferência!");
  };

  const resetForm = () => {
    setGeneratedExercises(null);
    setExerciseType("mixed");
    setQuestionCount(5);
    setShowAnswers(false);
    setShowHints(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const exerciseTypeOptions = [
    { value: "objective", label: "Objetivas", icon: CheckSquare, description: "Múltipla escolha" },
    { value: "subjective", label: "Subjetivas", icon: MessageSquare, description: "Dissertativas" },
    { value: "case_study", label: "Estudos de Caso", icon: Briefcase, description: "Casos práticos" },
    { value: "mixed", label: "Mista", icon: Shuffle, description: "Todos os tipos" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-green-600" />
            Criar Exercícios - {moduleTitle}
          </DialogTitle>
        </DialogHeader>

        {!generatedExercises ? (
          <div className="space-y-6 py-4">
            {/* Tipo de Exercício */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Exercícios</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {exerciseTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExerciseType(option.value as ExerciseType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      exerciseType === option.value
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <option.icon className={`h-6 w-6 mx-auto mb-2 ${
                      exerciseType === option.value ? "text-green-600" : "text-gray-500"
                    }`} />
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Número de Exercícios */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Número de Exercícios: {questionCount}
              </Label>
              <Slider
                value={[questionCount]}
                onValueChange={([v]) => setQuestionCount(v)}
                min={3}
                max={15}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>3</span>
                <span>15</span>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div id="exercises-content" className="space-y-6 py-4">
              {/* Cabeçalho */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">Exercícios</h2>
                <p className="text-muted-foreground mt-1">{generatedExercises.moduleTitle}</p>
              </div>

              {/* Exercícios */}
              <div className="space-y-6">
                {generatedExercises.exercises.map((exercise) => (
                  <div key={exercise.number} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold">Exercício {exercise.number}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {exercise.type === "objective" ? "Objetiva" : 
                         exercise.type === "subjective" ? "Subjetiva" : "Estudo de Caso"}
                      </span>
                    </div>
                    
                    {exercise.caseContext && (
                      <div className="bg-gray-50 p-3 rounded mb-3 text-sm italic">
                        {exercise.caseContext}
                      </div>
                    )}
                    
                    <p className="mb-3">{exercise.question}</p>
                    
                    {exercise.options && (
                      <div className="space-y-2 ml-4">
                        {exercise.options.map((option, idx) => (
                          <div key={idx} className={`${
                            showAnswers && option.startsWith(exercise.correctAnswer || "")
                              ? "text-green-600 font-medium"
                              : ""
                          }`}>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {exercise.caseQuestions && (
                      <div className="mt-3 space-y-2">
                        {exercise.caseQuestions.map((cq, idx) => (
                          <div key={idx} className="text-sm">
                            {String.fromCharCode(97 + idx)}) {cq}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showHints && exercise.hint && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-700">{exercise.hint}</p>
                      </div>
                    )}
                    
                    {showAnswers && (
                      <div className="mt-4 pt-3 border-t space-y-2">
                        {exercise.correctAnswer && (
                          <p className="text-green-600 text-sm">
                            <strong>Resposta:</strong> {exercise.correctAnswer}
                          </p>
                        )}
                        {exercise.explanation && (
                          <p className="text-gray-600 text-sm">
                            <strong>Explicação:</strong> {exercise.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          {!generatedExercises ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateExercisesMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {generateExercisesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Gerar Exercícios
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 mr-auto">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-hints"
                    checked={showHints}
                    onCheckedChange={(checked) => setShowHints(checked as boolean)}
                  />
                  <Label htmlFor="show-hints" className="text-sm">Dicas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-answers-ex"
                    checked={showAnswers}
                    onCheckedChange={(checked) => setShowAnswers(checked as boolean)}
                  />
                  <Label htmlFor="show-answers-ex" className="text-sm">Respostas</Label>
                </div>
              </div>
              <Button variant="outline" onClick={resetForm}>
                Novos Exercícios
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
