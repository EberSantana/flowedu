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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Send,
  Calendar,
  Users,
} from "lucide-react";

interface ExerciseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
  moduleTitle: string;
  subjectId: number;
}

type ExerciseType = "objective" | "subjective" | "case_study" | "pbl" | "mixed";

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
  subjectId,
}: ExerciseGeneratorModalProps) {
  // Component state
  const [exerciseType, setExerciseType] = useState<ExerciseType>("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedExercises, setGeneratedExercises] = useState<GeneratedExercises | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishConfig, setPublishConfig] = useState({
    title: "",
    description: "",
    availableFrom: "",
    availableUntil: "",
    maxAttempts: 3,
    timeLimit: 0, // 0 = sem limite
    showAnswersAfter: "submission" as "submission" | "deadline" | "never",
  });

  const generateExercisesMutation = trpc.learningPath.generateModuleExercises.useMutation({
    onSuccess: (data) => {
      setGeneratedExercises(data as GeneratedExercises);
      toast.success("Exercícios gerados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar exercícios: " + error.message);
    },
  });

  const publishExercisesMutation = (trpc.teacherExercises as any).publish.useMutation({
    onSuccess: () => {
      toast.success("Exercícios publicados com sucesso!");
      setShowPublishDialog(false);
      // Resetar configurações
      setPublishConfig({
        title: "",
        description: "",
        availableFrom: "",
        availableUntil: "",
        maxAttempts: 3,
        timeLimit: 0,
        showAnswersAfter: "submission",
      });
    },
    onError: (error: any) => {
      toast.error("Erro ao publicar: " + error.message);
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
    { value: "subjective", label: "Subjetivas", icon: MessageSquare, description: "Dissertativas reflexivas" },
    { value: "case_study", label: "Estudos de Caso", icon: Briefcase, description: "Casos práticos" },
    { value: "pbl", label: "PBL", icon: Lightbulb, description: "Aprendizagem Baseada em Problemas" },
    { value: "mixed", label: "Mista", icon: Shuffle, description: "Todos os tipos" },
  ];

  return (
    <>
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
              <div className="grid grid-cols-2 gap-4">
                {exerciseTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExerciseType(option.value as ExerciseType)}
                    className={`p-5 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-[100px] ${
                      exerciseType === option.value
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-300 hover:shadow-sm"
                    }`}
                  >
                    <option.icon className={`h-8 w-8 mb-3 ${
                      exerciseType === option.value ? "text-green-600" : "text-gray-500"
                    }`} />
                    <div className="font-semibold text-sm text-center">{option.label}</div>
                    <div className="text-xs text-muted-foreground text-center mt-1">{option.description}</div>
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
          <div className="flex gap-6 h-[calc(90vh-200px)]">
            {/* Navegação Lateral Melhorada */}
            <div className="flex-shrink-0 w-20 bg-gradient-to-b from-green-50 to-emerald-50 rounded-xl p-3 space-y-3 overflow-y-auto max-h-[calc(90vh-200px)] border border-green-100 shadow-sm">
              <div className="text-xs font-semibold text-green-700 text-center mb-2 pb-2 border-b border-green-200">
                Questões
              </div>
              {generatedExercises.exercises.map((exercise, idx) => {
                return (
                  <button
                    key={exercise.number}
                    onClick={() => {
                      const element = document.getElementById(`exercise-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="w-full h-14 rounded-xl font-bold text-base transition-all duration-200 bg-white text-gray-700 hover:bg-green-500 hover:text-white hover:scale-105 hover:shadow-md border-2 border-green-200 hover:border-green-500 flex items-center justify-center"
                    title={`Ir para Exercício ${exercise.number}`}
                  >
                    {exercise.number}
                  </button>
                );
              })}
            </div>
            
            {/* Conteúdo Principal */}
            <ScrollArea className="flex-1 pr-4 [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll">
              <div id="exercises-content" className="space-y-6 py-4">
                {/* Cabeçalho */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-100">
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Exercícios</h2>
                  <p className="text-center text-gray-600">{generatedExercises.moduleTitle}</p>
                </div>

                {/* Exercícios */}
                <div className="space-y-8">
                  {generatedExercises.exercises.map((exercise, idx) => (
                    <div key={exercise.number} id={`exercise-${idx}`} className="border-2 border-green-100 rounded-2xl p-8 bg-white shadow-md hover:shadow-lg transition-all duration-200 scroll-mt-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg">
                          {exercise.number}
                        </div>
                        <span className="text-xl font-bold text-gray-900">Exercício {exercise.number}</span>
                      </div>
                      <span className="text-sm bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                        {exercise.type === "objective" ? "Objetiva" : 
                         exercise.type === "subjective" ? "Subjetiva" :
                         exercise.type === "pbl" ? "PBL" : "Estudo de Caso"}
                      </span>
                    </div>
                    
                    {exercise.caseContext && (
                      <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-lg mb-6 text-base italic text-gray-700 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 font-semibold text-sm uppercase tracking-wide">Contexto:</span>
                        </div>
                        <p className="mt-2">{exercise.caseContext}</p>
                      </div>
                    )}
                    
                    <p className="mb-6 text-lg text-gray-800 leading-relaxed font-medium">{exercise.question}</p>
                    
                    {exercise.options && (
                      <div className="space-y-3 ml-2">
                        {exercise.options.map((option, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            showAnswers && option.startsWith(exercise.correctAnswer || "")
                              ? "bg-green-50 border-green-400 text-green-700 font-semibold shadow-sm"
                              : "bg-gray-50 border-gray-200 text-gray-700 hover:border-green-200 hover:bg-green-50/30"
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
                    
                    {showAnswers && (exercise.correctAnswer || exercise.explanation) && (
                      <div className="mt-6 pt-6 border-t-2 border-green-100 space-y-4">
                        {exercise.correctAnswer && (
                          <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckSquare className="h-5 w-5 text-green-600" />
                              <strong className="font-bold text-green-700 text-base">Resposta Correta:</strong>
                            </div>
                            <p className="text-green-700 text-base leading-relaxed ml-7">{exercise.correctAnswer}</p>
                          </div>
                        )}
                        {exercise.explanation && (
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-5 w-5 text-blue-600" />
                              <strong className="font-bold text-blue-700 text-base">Justificativa:</strong>
                            </div>
                            <p className="text-blue-700 text-base leading-relaxed ml-7">{exercise.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          
        </div>
        )}

        <DialogFooter className="flex-shrink-0 border-t pt-6 bg-gradient-to-r from-gray-50 to-green-50">
          {!generatedExercises ? (
            <div className="flex justify-end gap-3 w-full">
              <Button variant="outline" onClick={handleClose} className="px-6">
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateExercisesMutation.isPending}
                className="bg-green-600 hover:bg-green-700 px-8 shadow-md hover:shadow-lg transition-all"
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
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {/* Linha 1: Abas de Visualização */}
              <div className="flex items-center gap-6 pb-4 border-b">
                <span className="text-sm font-semibold text-gray-700">Visualizar:</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all">
                  <Checkbox
                    id="show-hints"
                    checked={showHints}
                    onCheckedChange={(checked) => setShowHints(checked as boolean)}
                  />
                  <Label htmlFor="show-hints" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Dicas
                  </Label>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-green-300 transition-all">
                  <Checkbox
                    id="show-answers-ex"
                    checked={showAnswers}
                    onCheckedChange={(checked) => setShowAnswers(checked as boolean)}
                  />
                  <Label htmlFor="show-answers-ex" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    Respostas
                  </Label>
                </div>
              </div>
              
              {/* Linha 2: Ações Principais */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button 
                  onClick={() => setShowPublishDialog(true)} 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  size="lg"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Publicar para Alunos
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportWord} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 px-5 transition-all">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Word
                  </Button>
                  <Button variant="outline" onClick={handleCopy} className="px-5 hover:bg-gray-100 transition-all">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Texto
                  </Button>
                  <Button onClick={handleClose} variant="outline" className="px-5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all">
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Dialog de Publicação */}
    <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Send className="h-6 w-6 text-green-600" />
            Publicar Exercícios para Alunos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="publish-title" className="text-sm font-semibold">
              Título do Exercício *
            </Label>
            <Input
              id="publish-title"
              placeholder="Ex: Avaliação do Módulo 1"
              value={publishConfig.title}
              onChange={(e) => setPublishConfig({ ...publishConfig, title: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="publish-description" className="text-sm font-semibold">
              Descrição (opcional)
            </Label>
            <Textarea
              id="publish-description"
              placeholder="Instruções ou observações para os alunos..."
              value={publishConfig.description}
              onChange={(e) => setPublishConfig({ ...publishConfig, description: e.target.value })}
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Datas de disponibilidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="available-from" className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Disponível a partir de
              </Label>
              <Input
                id="available-from"
                type="datetime-local"
                value={publishConfig.availableFrom}
                onChange={(e) => setPublishConfig({ ...publishConfig, availableFrom: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="available-until" className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Disponível até
              </Label>
              <Input
                id="available-until"
                type="datetime-local"
                value={publishConfig.availableUntil}
                onChange={(e) => setPublishConfig({ ...publishConfig, availableUntil: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          {/* Tentativas máximas */}
          <div className="space-y-2">
            <Label htmlFor="max-attempts" className="text-sm font-semibold">
              Tentativas Máximas
            </Label>
            <Select
              value={publishConfig.maxAttempts.toString()}
              onValueChange={(value) => setPublishConfig({ ...publishConfig, maxAttempts: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 tentativa</SelectItem>
                <SelectItem value="2">2 tentativas</SelectItem>
                <SelectItem value="3">3 tentativas</SelectItem>
                <SelectItem value="5">5 tentativas</SelectItem>
                <SelectItem value="999">Ilimitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tempo limite */}
          <div className="space-y-2">
            <Label htmlFor="time-limit" className="text-sm font-semibold">
              Tempo Limite (minutos)
            </Label>
            <Input
              id="time-limit"
              type="number"
              min="0"
              placeholder="0 = sem limite"
              value={publishConfig.timeLimit}
              onChange={(e) => setPublishConfig({ ...publishConfig, timeLimit: parseInt(e.target.value) || 0 })}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Deixe 0 para não ter limite de tempo</p>
          </div>

          {/* Quando mostrar respostas */}
          <div className="space-y-2">
            <Label htmlFor="show-answers-after" className="text-sm font-semibold">
              Mostrar Respostas
            </Label>
            <Select
              value={publishConfig.showAnswersAfter}
              onValueChange={(value: any) => setPublishConfig({ ...publishConfig, showAnswersAfter: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submission">Após envio (imediatamente)</SelectItem>
                <SelectItem value="deadline">Após prazo final</SelectItem>
                <SelectItem value="never">Nunca mostrar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resumo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resumo da Publicação
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {questionCount} questões ({exerciseType === "mixed" ? "mistas" : exerciseType})</li>
              <li>• {publishConfig.maxAttempts === 999 ? "Tentativas ilimitadas" : `${publishConfig.maxAttempts} tentativa(s)`}</li>
              <li>• {publishConfig.timeLimit > 0 ? `${publishConfig.timeLimit} minutos` : "Sem limite de tempo"}</li>
              <li>• Respostas: {publishConfig.showAnswersAfter === "submission" ? "Imediatas" : publishConfig.showAnswersAfter === "deadline" ? "Após prazo" : "Não mostrar"}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (!publishConfig.title.trim()) {
                toast.error("Título é obrigatório!");
                return;
              }
              if (!generatedExercises) {
                toast.error("Nenhum exercício gerado!");
                return;
              }

              // Preparar dados para publicação
              const exerciseData = {
                exercises: generatedExercises.exercises.map((ex) => ({
                  question: ex.question,
                  type: ex.type,
                  options: ex.options || [],
                  correctAnswer: ex.correctAnswer || "",
                  explanation: ex.explanation || null,
                }))
              };

              publishExercisesMutation.mutate({
                moduleId,
                subjectId,
                title: publishConfig.title,
                description: publishConfig.description || undefined,
                exerciseData: exerciseData, // Enviar como objeto, não string
                totalQuestions: generatedExercises.exercises.length,
                totalPoints: generatedExercises.exercises.length * 10, // 10 pontos por questão
                passingScore: 60,
                maxAttempts: publishConfig.maxAttempts === 999 ? 999 : publishConfig.maxAttempts,
                timeLimit: publishConfig.timeLimit > 0 ? publishConfig.timeLimit : undefined,
                showAnswersAfter: publishConfig.showAnswersAfter === "submission",
                availableFrom: publishConfig.availableFrom ? new Date(publishConfig.availableFrom) : new Date(),
                availableTo: publishConfig.availableUntil ? new Date(publishConfig.availableUntil) : undefined,
              });
            }}
            disabled={publishExercisesMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {publishExercisesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Publicar Agora
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
