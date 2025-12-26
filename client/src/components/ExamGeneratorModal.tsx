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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
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
          <div className="flex-1 flex gap-4">
            {/* Barra Lateral de Navegação */}
            <div className="flex-shrink-0 w-16 bg-gray-50 rounded-lg p-2 space-y-2 overflow-y-auto max-h-[calc(90vh-200px)]">
              {generatedExam.questions.map((question, idx) => {
                const questionElement = document.getElementById(`question-${idx}`);
                const isActive = false; // Será implementado com scroll listener
                return (
                  <button
                    key={question.number}
                    onClick={() => {
                      const element = document.getElementById(`question-${idx}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`w-full h-12 rounded-lg font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-purple-100 hover:text-purple-700 border border-gray-200'
                    }`}
                    title={`Ir para Questão ${question.number}`}
                  >
                    {question.number}
                  </button>
                );
              })}
            </div>

            {/* Conteúdo Principal */}
            <ScrollArea className="flex-1 pr-6 [&>[data-radix-scroll-area-viewport]]:!overflow-y-scroll">
              <div id="exam-content" className="space-y-12 py-6 px-2">
                {/* Cabeçalho da Prova */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8 border border-purple-100">
                  <h2 className="text-xl font-bold text-center text-gray-800 mb-4">{generatedExam.title}</h2>
                  <div className="bg-white/80 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
                    {generatedExam.instructions}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Total de Pontos: {generatedExam.totalPoints}
                    </span>
                  </div>
                </div>

                {/* Questões */}
                <div className="space-y-10">
                  {generatedExam.questions.map((question, idx) => (
                    <div key={question.number} id={`question-${idx}`} className="scroll-mt-4">
                      {/* Header da Questão */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-8 border-l-4 border-purple-500 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900">Questão {question.number}</h3>
                          <div className="flex gap-3">
                            <span className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg font-semibold shadow-sm">
                              {question.points} pts
                            </span>
                            <span className="text-sm bg-purple-500 text-white px-3 py-1 rounded-lg font-semibold shadow-sm">
                              {question.type === "objective" ? "Objetiva" : 
                               question.type === "subjective" ? "Subjetiva" : "Estudo de Caso"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contexto do Caso (se houver) */}
                      {question.caseContext && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-6">
                          <div className="flex items-start gap-3">
                            <Briefcase className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">Estudo de Caso</h4>
                              <p className="text-base text-gray-800 leading-relaxed italic">{question.caseContext}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enunciado da Questão */}
                      <div className="bg-white border-2 border-gray-300 rounded-xl p-8 mb-8 shadow-md">
                        <p className="text-base text-gray-900 leading-relaxed font-medium">{question.question}</p>
                      </div>

                      {/* Alternativas (Questões Objetivas) */}
                      {question.options && (
                        <div className="space-y-4 mb-6">
                          {question.options.map((option, idx) => {
                            const letter = String.fromCharCode(65 + idx); // A, B, C, D
                            const isCorrect = showAnswers && option.startsWith(question.correctAnswer || "");
                            
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-4 p-5 rounded-lg border-2 transition-all ${
                                  isCorrect 
                                    ? "bg-green-50 border-green-400 shadow-md" 
                                    : "bg-gray-50 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isCorrect 
                                    ? "bg-green-500 text-white" 
                                    : "bg-gray-300 text-gray-700"
                                }`}>
                                  {letter}
                                </div>
                                <p className={`text-base leading-relaxed flex-1 ${
                                  isCorrect 
                                    ? "text-green-900 font-bold" 
                                    : "text-gray-900"
                                }`}>
                                  {option.replace(/^[A-E]\)\s*/, '')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sub-questões (Estudo de Caso) */}
                      {question.caseQuestions && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                          <h4 className="text-base font-semibold text-gray-700 mb-4">Responda:</h4>
                          <div className="space-y-4">
                            {question.caseQuestions.map((cq, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                                  {String.fromCharCode(97 + idx)}
                                </span>
                                <p className="text-base text-gray-900 leading-relaxed flex-1">{cq}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gabarito e Justificativa */}
                      {showAnswers && (question.correctAnswer || question.expectedAnswer) && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 space-y-4">
                          {question.correctAnswer && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="h-5 w-5 text-green-600" />
                                <h4 className="text-base font-bold text-green-900 uppercase tracking-wide">Resposta Correta</h4>
                              </div>
                              <p className="text-xl text-green-800 font-bold pl-7">{question.correctAnswer}</p>
                            </div>
                          )}
                          {question.expectedAnswer && (
                            <div className="pt-3 border-t border-green-200">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageSquare className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <h4 className="text-base font-bold text-green-900 uppercase tracking-wide mb-2">Justificativa</h4>
                                  <p className="text-lg text-gray-800 leading-relaxed">{question.expectedAnswer}</p>
                                </div>
                              </div>
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
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-answers"
                  checked={showAnswers}
                  onCheckedChange={(checked) => setShowAnswers(checked as boolean)}
                />
                <Label htmlFor="show-answers" className="text-sm font-medium">
                  Mostrar gabarito
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExportWord} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Download className="h-4 w-4 mr-2" />
                  Word
                </Button>
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
                <Button onClick={handleClose} className="bg-gray-600 hover:bg-gray-700 text-white">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
