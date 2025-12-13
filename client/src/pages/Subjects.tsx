import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BookOpen, Plus, Pencil, Trash2, ArrowLeft, FileText, ChevronDown, ChevronUp, Download, Users, Route } from "lucide-react";
import { jsPDF } from "jspdf";
import { Link } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function Subjects() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    color: "#3b82f6",
    ementa: "",
    generalObjective: "",
    specificObjectives: "",
    programContent: "",
    basicBibliography: "",
    complementaryBibliography: "",
    googleDriveUrl: "",
    googleClassroomUrl: "",
  });
  const [showCoursePlan, setShowCoursePlan] = useState(false);
  const [viewingCoursePlan, setViewingCoursePlan] = useState<any>(null);

  const exportToPDF = () => {
    if (!viewingCoursePlan) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Função auxiliar para adicionar texto com quebra de linha
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setTextColor(color[0], color[1], color[2]);
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      });
      
      yPosition += 5;
    };

    // Cabeçalho
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Plano de Curso", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(viewingCoursePlan.name, pageWidth / 2, 23, { align: "center" });
    
    yPosition = 40;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Código: ${viewingCoursePlan.code}`, margin, yPosition);
    yPosition += 15;

    // Seções do plano de curso
    const sections = [
      { title: "Ementa", content: viewingCoursePlan.ementa, color: [59, 130, 246] },
      { title: "Objetivo Geral", content: viewingCoursePlan.generalObjective, color: [34, 197, 94] },
      { title: "Objetivos Específicos", content: viewingCoursePlan.specificObjectives, color: [168, 85, 247] },
      { title: "Conteúdo Programático", content: viewingCoursePlan.programContent, color: [249, 115, 22] },
      { title: "Bibliografia Básica", content: viewingCoursePlan.basicBibliography, color: [239, 68, 68] },
      { title: "Bibliografia Complementar", content: viewingCoursePlan.complementaryBibliography, color: [236, 72, 153] },
    ];

    sections.forEach(section => {
      if (section.content) {
        // Título da seção com cor
        addText(section.title, 14, true, section.color);
        yPosition -= 3;
        
        // Linha colorida
        doc.setDrawColor(section.color[0], section.color[1], section.color[2]);
        doc.setLineWidth(1);
        doc.line(margin, yPosition, margin + 40, yPosition);
        yPosition += 8;
        
        // Conteúdo
        addText(section.content, 10, false);
        yPosition += 5;
      }
    });

    // Salvar PDF
    const fileName = `Plano_de_Curso_${viewingCoursePlan.code.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
    toast.success("PDF exportado com sucesso!");
  };

  const { data: subjects, isLoading } = trpc.subjects.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.subjects.create.useMutation({
    onSuccess: () => {
      utils.subjects.list.invalidate();
      toast.success("Disciplina criada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar disciplina: " + error.message);
    },
  });

  const updateMutation = trpc.subjects.update.useMutation({
    onSuccess: () => {
      utils.subjects.list.invalidate();
      toast.success("Disciplina atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar disciplina: " + error.message);
    },
  });

  const deleteMutation = trpc.subjects.delete.useMutation({
    onSuccess: () => {
      utils.subjects.list.invalidate();
      toast.success("Disciplina excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir disciplina: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ 
      name: "", 
      code: "", 
      description: "", 
      color: "#3b82f6",
      ementa: "",
      generalObjective: "",
      specificObjectives: "",
      programContent: "",
      basicBibliography: "",
      complementaryBibliography: "",
      googleDriveUrl: "",
      googleClassroomUrl: "",
    });
    setEditingSubject(null);
    setIsDialogOpen(false);
    setShowCoursePlan(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter strings vazias para undefined para campos opcionais
    const cleanedData = {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      color: formData.color,
      ementa: formData.ementa || undefined,
      generalObjective: formData.generalObjective || undefined,
      specificObjectives: formData.specificObjectives || undefined,
      programContent: formData.programContent || undefined,
      basicBibliography: formData.basicBibliography || undefined,
      complementaryBibliography: formData.complementaryBibliography || undefined,
      googleDriveUrl: formData.googleDriveUrl || undefined,
      googleClassroomUrl: formData.googleClassroomUrl || undefined,
    };
    
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, ...cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const handleEdit = (subject: any) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
      color: subject.color || "#3b82f6",
      ementa: subject.ementa || "",
      generalObjective: subject.generalObjective || "",
      specificObjectives: subject.specificObjectives || "",
      programContent: subject.programContent || "",
      basicBibliography: subject.basicBibliography || "",
      complementaryBibliography: subject.complementaryBibliography || "",
      googleDriveUrl: subject.googleDriveUrl || "",
      googleClassroomUrl: subject.googleClassroomUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta disciplina?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                Gerenciar Disciplinas
              </h1>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Disciplina
            </Button>
          </div>

        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="bg-white shadow-md hover:shadow-lg transition-all duration-200 flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: subject.color || "#3b82f6" }}
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{subject.name}</CardTitle>
                      <CardDescription className="text-xs">Código: {subject.code}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1">
                    {subject.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{subject.description}</p>
                    )}
                  </div>
                  {(subject.ementa || subject.generalObjective || subject.specificObjectives || subject.programContent || subject.basicBibliography || subject.complementaryBibliography) && (
                    <button
                      onClick={() => setViewingCoursePlan(subject)}
                      className="mb-4 w-full p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-blue-700 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Plano de Curso cadastrado</span>
                        </div>
                        <span className="text-xs text-blue-600">Clique para visualizar</span>
                      </div>
                    </button>
                  )}
                  
                  {/* Botões de Integração Google */}
                  {(subject.googleDriveUrl || subject.googleClassroomUrl) && (
                    <div className="mb-4 flex gap-2">
                      {subject.googleDriveUrl && (
                        <a
                          href={subject.googleDriveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                          </svg>
                          Drive
                        </a>
                      )}
                      {subject.googleClassroomUrl && (
                        <a
                          href={subject.googleClassroomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 p-2 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                          </svg>
                          Classroom
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-auto pt-3">
                    <Link href={`/subjects/${subject.id}/enrollments`}>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Users className="mr-2 h-3 w-3" />
                        Gerenciar Alunos
                      </Button>
                    </Link>
                    <Link href="/learning-paths">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        <Route className="mr-2 h-3 w-3" />
                        Trilhas de Aprendizagem
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(subject)}
                        className="flex-1"
                      >
                        <Pencil className="mr-2 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white shadow-lg">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma disciplina cadastrada ainda.</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Disciplina
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Editar Disciplina" : "Nova Disciplina"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da disciplina abaixo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="coursePlan">Plano de Curso</TabsTrigger>
                  <TabsTrigger value="googleIntegration">Integração Google</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Disciplina</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Matemática"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: MAT101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da disciplina"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                </TabsContent>
                
                <TabsContent value="coursePlan" className="py-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4 pb-4">
                      <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="space-y-2">
                        <Label htmlFor="ementa">Ementa</Label>
                        <Textarea
                          id="ementa"
                          value={formData.ementa}
                          onChange={(e) => setFormData({ ...formData, ementa: e.target.value })}
                          placeholder="Descreva a ementa da disciplina..."
                          rows={3}
                        />
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                        <div className="space-y-2">
                        <Label htmlFor="generalObjective">Objetivo Geral</Label>
                        <Textarea
                          id="generalObjective"
                          value={formData.generalObjective}
                          onChange={(e) => setFormData({ ...formData, generalObjective: e.target.value })}
                          placeholder="Descreva o objetivo geral da disciplina..."
                          rows={3}
                        />
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                        <div className="space-y-2">
                        <Label htmlFor="specificObjectives">Objetivos Específicos</Label>
                        <Textarea
                          id="specificObjectives"
                          value={formData.specificObjectives}
                          onChange={(e) => setFormData({ ...formData, specificObjectives: e.target.value })}
                          placeholder="Liste os objetivos específicos..."
                          rows={4}
                        />
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                        <div className="space-y-2">
                        <Label htmlFor="programContent">Conteúdo Programático</Label>
                        <Textarea
                          id="programContent"
                          value={formData.programContent}
                          onChange={(e) => setFormData({ ...formData, programContent: e.target.value })}
                          placeholder="Liste os tópicos e conteúdos que serão abordados..."
                          rows={4}
                        />
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                        <div className="space-y-2">
                        <Label htmlFor="basicBibliography">Bibliografia Básica</Label>
                        <Textarea
                          id="basicBibliography"
                          value={formData.basicBibliography}
                          onChange={(e) => setFormData({ ...formData, basicBibliography: e.target.value })}
                          placeholder="Liste as referências bibliográficas básicas..."
                          rows={4}
                        />
                        </div>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg border-l-4 border-pink-500">
                        <div className="space-y-2">
                        <Label htmlFor="complementaryBibliography">Bibliografia Complementar</Label>
                        <Textarea
                          id="complementaryBibliography"
                          value={formData.complementaryBibliography}
                          onChange={(e) => setFormData({ ...formData, complementaryBibliography: e.target.value })}
                          placeholder="Liste as referências bibliográficas complementares..."
                          rows={4}
                        />
                        </div>
                      </div>
                      

                      </div>
                    </ScrollArea>
                </TabsContent>
                
                <TabsContent value="googleIntegration" className="py-4">
                  <div className="space-y-6">
                    {/* Header com ícone Google */}
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Integração com Google Workspace</h3>
                        <p className="text-sm text-gray-500">Conecte sua disciplina com Google Drive e Classroom</p>
                      </div>
                    </div>
                    
                    {/* Google Drive */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start gap-3 mb-3">
                        <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-800 mb-1">Google Drive</h4>
                          <p className="text-sm text-blue-700 mb-3">Armazene e compartilhe materiais didáticos, apostilas, apresentações e recursos da disciplina</p>
                          <div className="space-y-2">
                            <Label htmlFor="googleDriveUrl" className="text-blue-900">Link da Pasta do Drive</Label>
                            <Input
                              id="googleDriveUrl"
                              value={formData.googleDriveUrl}
                              onChange={(e) => setFormData({ ...formData, googleDriveUrl: e.target.value })}
                              placeholder="https://drive.google.com/drive/folders/..."
                              type="url"
                              className="bg-white"
                            />
                            <p className="text-xs text-blue-600">💡 Dica: Crie uma pasta específica para a disciplina e cole o link aqui</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Google Classroom */}
                    <div className="bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-lg border-2 border-green-200">
                      <div className="flex items-start gap-3 mb-3">
                        <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800 mb-1">Google Classroom</h4>
                          <p className="text-sm text-green-700 mb-3">Gerencie turmas virtuais, publique atividades, avaliações e interaja com alunos</p>
                          <div className="space-y-2">
                            <Label htmlFor="googleClassroomUrl" className="text-green-900">Link da Turma Virtual</Label>
                            <Input
                              id="googleClassroomUrl"
                              value={formData.googleClassroomUrl}
                              onChange={(e) => setFormData({ ...formData, googleClassroomUrl: e.target.value })}
                              placeholder="https://classroom.google.com/c/..."
                              type="url"
                              className="bg-white"
                            />
                            <p className="text-xs text-green-600">💡 Dica: Acesse o Classroom, abra a turma e copie o link da barra de endereços</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informação adicional */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong className="text-gray-800">ℹ️ Importante:</strong> Os links configurados aqui aparecerão como botões de acesso rápido nos cards das disciplinas, facilitando o acesso aos recursos do Google.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSubject ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização do Plano de Curso */}
        <Dialog open={!!viewingCoursePlan} onOpenChange={() => setViewingCoursePlan(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Plano de Curso - {viewingCoursePlan?.name}
              </DialogTitle>
              <DialogDescription>
                Código: {viewingCoursePlan?.code}
              </DialogDescription>
            </DialogHeader>
            
            {viewingCoursePlan && (
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6 py-4">
                {viewingCoursePlan.ementa && (
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Ementa</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.ementa}</p>
                  </div>
                )}

                {viewingCoursePlan.generalObjective && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Objetivo Geral</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.generalObjective}</p>
                  </div>
                )}

                {viewingCoursePlan.specificObjectives && (
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Objetivos Específicos</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.specificObjectives}</p>
                  </div>
                )}

                {viewingCoursePlan.programContent && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Conteúdo Programático</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.programContent}</p>
                  </div>
                )}

                {viewingCoursePlan.basicBibliography && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Bibliografia Básica</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.basicBibliography}</p>
                  </div>
                )}

                {viewingCoursePlan.complementaryBibliography && (
                  <div className="border-l-4 border-pink-500 pl-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Bibliografia Complementar</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{viewingCoursePlan.complementaryBibliography}</p>
                  </div>
                )}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={exportToPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button type="button" onClick={() => setViewingCoursePlan(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
