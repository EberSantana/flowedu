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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  CheckSquare,
  MessageSquare,
  Briefcase,
  Shuffle,
  Download,
  Printer,
  Copy,
} from "lucide-react";

interface ExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
  modules: Array<{ id: number; title: string }>;
}

type ExamType = "objective" | "subjective" | "case_study" | "mixed";
type Difficulty = "easy" | "medium" | "hard" | "mixed";

interface GeneratedExam {
  title: string;
  instructions: string;
  totalPoints: number;
  questions: Array<{
    number: number;
    type: string;
    points: number;
    difficulty: string;
    module: string;
    question: string;
    options?: string[];
    correctAnswer?: string;
    expectedAnswer?: string;
    caseContext?: string;
    caseQuestions?: string[];
  }>;
}

export default function ExamGeneratorModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  modules,
}: ExamGeneratorModalProps) {
  const [examType, setExamType] = useState<ExamType>("mixed");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const generateExamMutation = trpc.learningPath.generateExam.useMutation({
    onSuccess: (data) => {
      setGeneratedExam(data as GeneratedExam);
      toast.success("Prova gerada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar prova: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (modules.length === 0) {
      toast.error("Crie módulos primeiro para gerar a prova");
      return;
    }

    generateExamMutation.mutate({
      subjectId,
      examType,
      moduleIds: selectedModules.length > 0 ? selectedModules : undefined,
      questionCount,
      difficulty,
    });
  };

  const handleModuleToggle = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSelectAllModules = () => {
    if (selectedModules.length === modules.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(modules.map((m) => m.id));
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("exam-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${generatedExam?.title || "Prova"}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                .question { margin-bottom: 20px; page-break-inside: avoid; }
                .options { margin-left: 20px; }
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
    if (!generatedExam) return;
    
    let text = `${generatedExam.title}\n\n`;
    text += `${generatedExam.instructions}\n\n`;
    
    generatedExam.questions.forEach((q) => {
      text += `${q.number}. ${q.question}\n`;
      if (q.options) {
        q.options.forEach((opt) => {
          text += `   ${opt}\n`;
        });
      }
      if (showAnswers) {
        if (q.correctAnswer) text += `   Resposta: ${q.correctAnswer}\n`;
        if (q.expectedAnswer) text += `   Resposta esperada: ${q.expectedAnswer}\n`;
      }
      text += "\n";
    });
    
    navigator.clipboard.writeText(text);
    toast.success("Prova copiada para a área de transferência!");
  };

  const handleExportPDF = async () => {
    if (!generatedExam) return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;
      
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(generatedExam.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Instruções
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitInstructions = doc.splitTextToSize(generatedExam.instructions, pageWidth - 2 * margin);
      doc.text(splitInstructions, margin, yPosition);
      yPosition += splitInstructions.length * 5 + 5;
      
      // Total de pontos
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de Pontos: ${generatedExam.totalPoints}`, margin, yPosition);
      yPosition += 10;
      
      // Questões
      generatedExam.questions.forEach((question, idx) => {
        // Verificar se precisa de nova página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Número e tipo da questão
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Questão ${question.number} (${question.points} pts)`, margin, yPosition);
        yPosition += 7;
        
        // Contexto do caso (se houver)
        if (question.caseContext) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          const splitContext = doc.splitTextToSize(question.caseContext, pageWidth - 2 * margin);
          doc.text(splitContext, margin, yPosition);
          yPosition += splitContext.length * 4 + 3;
        }
        
        // Pergunta
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitQuestion = doc.splitTextToSize(question.question, pageWidth - 2 * margin);
        doc.text(splitQuestion, margin, yPosition);
        yPosition += splitQuestion.length * 5 + 3;
        
        // Opções (se houver)
        if (question.options) {
          question.options.forEach((option) => {
            const splitOption = doc.splitTextToSize(option, pageWidth - 2 * margin - 10);
            doc.text(splitOption, margin + 5, yPosition);
            yPosition += splitOption.length * 5;
          });
          yPosition += 3;
        }
        
        // Gabarito (se ativado)
        if (showAnswers) {
          if (question.correctAnswer) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 150, 105);
            doc.text(`Resposta: ${question.correctAnswer}`, margin + 5, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += 5;
          }
          if (question.expectedAnswer) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 150, 105);
            const splitAnswer = doc.splitTextToSize(`Resposta esperada: ${question.expectedAnswer}`, pageWidth - 2 * margin - 10);
            doc.text(splitAnswer, margin + 5, yPosition);
            doc.setTextColor(0, 0, 0);
            yPosition += splitAnswer.length * 5;
          }
        }
        
        yPosition += 5;
      });
      
      // Salvar PDF
      const fileName = `${generatedExam.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      doc.save(fileName);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleExportWord = async () => {
    if (!generatedExam) return;
    
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      
      const children: any[] = [];
      
      // Título
      children.push(
        new Paragraph({
          text: generatedExam.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );
      
      // Instruções
      children.push(
        new Paragraph({
          text: generatedExam.instructions,
          spacing: { after: 200 },
        })
      );
      
      // Total de pontos
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Total de Pontos: ${generatedExam.totalPoints}`,
              bold: true,
            }),
          ],
          spacing: { after: 300 },
        })
      );
      
      // Questões
      generatedExam.questions.forEach((question) => {
        // Número da questão
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Questão ${question.number} (${question.points} pts - ${question.type === 'objective' ? 'Objetiva' : question.type === 'subjective' ? 'Subjetiva' : 'Estudo de Caso'})`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        
        // Contexto do caso
        if (question.caseContext) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: question.caseContext,
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
            text: question.question,
            spacing: { after: 100 },
          })
        );
        
        // Opções
        if (question.options) {
          question.options.forEach((option) => {
            children.push(
              new Paragraph({
                text: option,
                indent: { left: 720 },
                spacing: { after: 50 },
              })
            );
          });
        }
        
        // Gabarito
        if (showAnswers) {
          if (question.correctAnswer) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Resposta: ${question.correctAnswer}`,
                    bold: true,
                    color: '059669',
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 100 },
              })
            );
          }
          if (question.expectedAnswer) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Resposta esperada: ${question.expectedAnswer}`,
                    bold: true,
                    color: '059669',
                  }),
                ],
                indent: { left: 720 },
                spacing: { after: 100 },
              })
            );
          }
        }
        
        // Espaço entre questões
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
      link.download = `${generatedExam.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Word exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Word:', error);
      toast.error('Erro ao exportar Word');
    }
  };

  const resetForm = () => {
    setGeneratedExam(null);
    setExamType("mixed");
    setDifficulty("mixed");
    setQuestionCount(10);
    setSelectedModules([]);
    setShowAnswers(false);
    setCurrentQuestionIndex(0);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (generatedExam) {
      setCurrentQuestionIndex((prev) => Math.min(generatedExam.questions.length - 1, prev + 1));
    }
  };

  const scrollToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const examTypeOptions = [
    { value: "objective", label: "Objetivas", icon: CheckSquare, description: "Múltipla escolha" },
    { value: "subjective", label: "Subjetivas", icon: MessageSquare, description: "Dissertativas" },
    { value: "case_study", label: "Estudos de Caso", icon: Briefcase, description: "Casos práticos" },
    { value: "mixed", label: "Mista", icon: Shuffle, description: "Todos os tipos" },
  ];

  const difficultyOptions = [
    { value: "easy", label: "Fácil" },
    { value: "medium", label: "Média" },
    { value: "hard", label: "Difícil" },
    { value: "mixed", label: "Variada" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Criar Prova com IA - {subjectName}
          </DialogTitle>
        </DialogHeader>

        {!generatedExam ? (
          <div className="space-y-6 py-4">
            {/* Tipo de Prova */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipo de Questões</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {examTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExamType(option.value as ExamType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      examType === option.value
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <option.icon className={`h-6 w-6 mx-auto mb-2 ${
                      examType === option.value ? "text-purple-600" : "text-gray-500"
                    }`} />
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dificuldade */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Dificuldade</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
                className="flex flex-wrap gap-4"
              >
                {difficultyOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`diff-${option.value}`} />
                    <Label htmlFor={`diff-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Número de Questões */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Número de Questões: {questionCount}
              </Label>
              <Slider
                value={[questionCount]}
                onValueChange={([v]) => setQuestionCount(v)}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>30</span>
              </div>
            </div>

            {/* Seleção de Módulos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Módulos (opcional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllModules}
                >
                  {selectedModules.length === modules.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione módulos específicos ou deixe em branco para usar todos
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => handleModuleToggle(module.id)}
                    />
                    <Label htmlFor={`module-${module.id}`} className="text-sm truncate">
                      {module.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Barra de Navegação */}
            <div className="flex items-center justify-between border-b pb-3 mb-3 px-4 no-print">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                ← Anterior
              </Button>
              <div className="flex gap-1 overflow-x-auto max-w-md">
                {generatedExam.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToQuestion(idx)}
                    className={`min-w-[32px] h-8 rounded ${
                      currentQuestionIndex === idx
                        ? "bg-green-600 text-white font-semibold"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentQuestionIndex === generatedExam.questions.length - 1}
              >
                Próximo →
              </Button>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div id="exam-content" className="space-y-6 py-4">
                {/* Cabeçalho da Prova */}
                <div className="text-center border-b pb-4 mb-6">
                  <h2 className="text-2xl font-bold">{generatedExam.title}</h2>
                  <p className="text-base text-muted-foreground mt-3 leading-relaxed">{generatedExam.instructions}</p>
                  <p className="text-base font-semibold mt-3">
                    Total de Pontos: {generatedExam.totalPoints}
                  </p>
                </div>

                {/* Questões */}
                <div className="space-y-8">
                  {generatedExam.questions.map((question, idx) => (
                    <div key={question.number} id={`question-${idx}`} className="border rounded-lg p-6 bg-white shadow-sm scroll-mt-4">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-lg font-bold text-gray-900">Questão {question.number}</span>
                      <div className="flex gap-2">
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded font-medium">
                          {question.points} pts
                        </span>
                        <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded font-medium">
                          {question.type === "objective" ? "Objetiva" : 
                           question.type === "subjective" ? "Subjetiva" : "Estudo de Caso"}
                        </span>
                      </div>
                    </div>
                    
                    {question.caseContext && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4 text-base italic text-gray-700 leading-relaxed">
                        {question.caseContext}
                      </div>
                    )}
                    
                    <p className="mb-4 text-base text-gray-800 leading-relaxed">{question.question}</p>
                    
                    {question.options && (
                      <div className="space-y-3 ml-6">
                        {question.options.map((option, idx) => (
                          <div key={idx} className={`text-base leading-relaxed ${
                            showAnswers && option.startsWith(question.correctAnswer || "")
                              ? "text-green-600 font-semibold"
                              : "text-gray-700"
                          }`}>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.caseQuestions && (
                      <div className="mt-4 space-y-3">
                        {question.caseQuestions.map((cq, idx) => (
                          <div key={idx} className="text-base text-gray-700 leading-relaxed">
                            {String.fromCharCode(97 + idx)}) {cq}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showAnswers && (
                      <div className="mt-5 pt-4 border-t space-y-3">
                        {question.correctAnswer && (
                          <p className="text-green-600 text-base leading-relaxed">
                            <strong className="font-semibold">Resposta:</strong> {question.correctAnswer}
                          </p>
                        )}
                        {question.expectedAnswer && (
                          <p className="text-green-600 text-base leading-relaxed">
                            <strong className="font-semibold">Resposta esperada:</strong> {question.expectedAnswer}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          </>
        )}

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          {!generatedExam ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateExamMutation.isPending || modules.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {generateExamMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Prova
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mr-auto">
                <Checkbox
                  id="show-answers"
                  checked={showAnswers}
                  onCheckedChange={(checked) => setShowAnswers(checked as boolean)}
                />
                <Label htmlFor="show-answers" className="text-sm">
                  Mostrar gabarito
                </Label>
              </div>
              <Button variant="outline" onClick={resetForm}>
                Nova Prova
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
