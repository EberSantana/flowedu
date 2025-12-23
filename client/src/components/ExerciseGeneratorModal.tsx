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
  Download,
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

  const handleExportPDF = async () => {
    if (!generatedExercises) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;
      
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Exercícios - ${generatedExercises.moduleTitle}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      // Exercícios
      generatedExercises.exercises.forEach((exercise) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Número do exercício
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Exercício ${exercise.number}`, margin, yPosition);
        yPosition += 7;
        
        // Contexto do caso (se houver)
        if (exercise.caseContext) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const splitContext = doc.splitTextToSize(exercise.caseContext, pageWidth - 2 * margin);
          doc.text(splitContext, margin, yPosition);
          yPosition += splitContext.length * 4 + 3;
        }
        
        // Pergunta
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitQuestion = doc.splitTextToSize(exercise.question, pageWidth - 2 * margin);
        doc.text(splitQuestion, margin, yPosition);
        yPosition += splitQuestion.length * 5 + 3;
        
        // Opções (se houver)
        if (exercise.options) {
          exercise.options.forEach((option) => {
            const splitOption = doc.splitTextToSize(option, pageWidth - 2 * margin - 10);
            doc.text(splitOption, margin + 5, yPosition);
            yPosition += splitOption.length * 5;
          });
          yPosition += 3;
        }
        
        // Dica (se ativado)
        if (showHints && exercise.hint) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(37, 99, 235);
          const splitHint = doc.splitTextToSize(`Dica: ${exercise.hint}`, pageWidth - 2 * margin - 10);
          doc.text(splitHint, margin + 5, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += splitHint.length * 5 + 3;
        }
        
        // Gabarito (se ativado)
        if (showAnswers) {
          if (exercise.correctAnswer) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 150, 105);
            doc.text(`Resposta: ${exercise.correctAnswer}`, margin + 5, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 5;
          }
          if (exercise.explanation) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(5, 150, 105);
            const splitExplanation = doc.splitTextToSize(`Explicação: ${exercise.explanation}`, pageWidth - 2 * margin - 10);
            doc.text(splitExplanation, margin + 5, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += splitExplanation.length * 5;
          }
        }
        
        yPosition += 5;
      });
      
      // Salvar PDF
      const fileName = `Exercicios_${generatedExercises.moduleTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      doc.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleExportWord = async () => {
    if (!generatedExercises) return;
    
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      
      const children: any[] = [];
      
      // Título
      children.push(
        new Paragraph({
          text: `Exercícios - ${generatedExercises.moduleTitle}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        })
      );
      
      // Exercícios
      generatedExercises.exercises.forEach((exercise) => {
        // Número do exercício
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Exercício ${exercise.number}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        
        // Contexto do caso
        if (exercise.caseContext) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exercise.caseContext,
                  italics: true,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
        
        // Pergunta
        children.push(
          new Paragraph({
            text: exercise.question,
            spacing: { after: 100 },
          })
        );
        
        // Opções
        if (exercise.options) {
          exercise.options.forEach((option) => {
            children.push(
              new Paragraph({
                text: option,
                indent: { left: 720 },
                spacing: { after: 50 },
              })
            );
          });
        }
        
        // Dica
        if (showHints && exercise.hint) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `💡 Dica: ${exercise.hint}`,
                  italics: true,
                  color: '2563eb',
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 100 },
            })
          );
        }
        
        // Gabarito
        if (showAnswers) {
          if (exercise.correctAnswer) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `✓ Resposta: ${exercise.correctAnswer}`,
                    bold: true,
                    color: '059669',
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 50 },
              })
            );
          }
          if (exercise.explanation) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `📝 Explicação: ${exercise.explanation}`,
                    color: '059669',
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 100 },
              })
            );
          }
        }
        
        // Espaço entre exercícios
        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 200 },
          })
        );
      });
      
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });
      
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Exercicios_${generatedExercises.moduleTitle.replace(/[^a-z0-9]/gi, '_')}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Word exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Word:', error);
      toast.error('Erro ao exportar Word');
    }
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
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold">Exercícios</h2>
                <p className="text-base text-muted-foreground mt-2">{generatedExercises.moduleTitle}</p>
              </div>

              {/* Exercícios */}
              <div className="space-y-8">
                {generatedExercises.exercises.map((exercise) => (
                  <div key={exercise.number} className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900">Exercício {exercise.number}</span>
                      <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded font-medium">
                        {exercise.type === "objective" ? "Objetiva" : 
                         exercise.type === "subjective" ? "Subjetiva" : "Estudo de Caso"}
                      </span>
                    </div>
                    
                    {exercise.caseContext && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 text-base italic text-gray-700 leading-relaxed">
                        {exercise.caseContext}
                      </div>
                    )}
                    
                    <p className="mb-4 text-base text-gray-800 leading-relaxed">{exercise.question}</p>
                    
                    {exercise.options && (
                      <div className="space-y-3 ml-6">
                        {exercise.options.map((option, idx) => (
                          <div key={idx} className={`text-base leading-relaxed ${
                            showAnswers && option.startsWith(exercise.correctAnswer || "")
                              ? "text-green-600 font-semibold"
                              : "text-gray-700"
                          }`}>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {exercise.caseQuestions && (
                      <div className="mt-4 space-y-3">
                        {exercise.caseQuestions.map((cq, idx) => (
                          <div key={idx} className="text-base text-gray-700 leading-relaxed">
                            {String.fromCharCode(97 + idx)}) {cq}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showHints && exercise.hint && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-base text-blue-700 leading-relaxed">{exercise.hint}</p>
                      </div>
                    )}
                    
                    {showAnswers && (
                      <div className="mt-5 pt-4 border-t space-y-3">
                        {exercise.correctAnswer && (
                          <p className="text-green-600 text-base leading-relaxed">
                            <strong className="font-semibold">Resposta:</strong> {exercise.correctAnswer}
                          </p>
                        )}
                        {exercise.explanation && (
                          <p className="text-gray-700 text-base leading-relaxed">
                            <strong className="font-semibold">Explicação:</strong> {exercise.explanation}
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
              <Button variant="outline" onClick={handleExportPDF} className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportWord} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                <Download className="h-4 w-4 mr-2" />
                Word
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
