import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Upload,
  Trash2,
  Plus,
  ArrowLeft,
  Download,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

type MaterialType = 'pdf' | 'video' | 'link' | 'document' | 'presentation' | 'other';

export default function TopicMaterialsManager() {
  const [, params] = useRoute("/learning-paths/:subjectId/topic/:topicId/materials");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const topicId = params?.topicId ? parseInt(params.topicId) : 0;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "link" as MaterialType,
    url: "",
    isRequired: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: subject } = trpc.subjects.list.useQuery();
  const currentSubject = subject?.find(s => s.id === subjectId);

  const { data: learningPath } = trpc.learningPath.getBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  const { data: materials, isLoading } = trpc.materials.getByTopic.useQuery(
    { topicId },
    { enabled: !!topicId }
  );

  const utils = trpc.useUtils();

  const createMaterialMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      utils.materials.getByTopic.invalidate();
      toast.success("Material adicionado com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar material: " + error.message);
    },
  });

  const updateMaterialMutation = trpc.materials.update.useMutation({
    onSuccess: () => {
      utils.materials.getByTopic.invalidate();
      toast.success("Material atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar material: " + error.message);
    },
  });

  const deleteMaterialMutation = trpc.materials.delete.useMutation({
    onSuccess: () => {
      utils.materials.getByTopic.invalidate();
      toast.success("Material removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover material: " + error.message);
    },
  });

  // Find current topic info
  const currentTopic = learningPath?.reduce((found: any, module: any) => {
    if (found) return found;
    return module.topics?.find((t: any) => t.id === topicId);
  }, null);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "link",
      url: "",
      isRequired: false,
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      let detectedType: MaterialType = 'other';
      
      if (extension === 'pdf') detectedType = 'pdf';
      else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension || '')) detectedType = 'video';
      else if (['doc', 'docx', 'txt', 'odt'].includes(extension || '')) detectedType = 'document';
      else if (['ppt', 'pptx', 'odp'].includes(extension || '')) detectedType = 'presentation';
      
      setFormData(prev => ({
        ...prev,
        type: detectedType,
        title: prev.title || file.name,
      }));
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        clearInterval(progressInterval);
        setUploadProgress(95);

        const base64Data = e.target?.result as string;
        const fileKey = `materials/${Date.now()}-${selectedFile.name}`;

        // Upload to S3 via tRPC
        const response = await fetch('/api/upload-material', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileKey,
            fileData: base64Data,
            contentType: selectedFile.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro no upload');
        }

        const { url } = await response.json();
        setUploadProgress(100);

        // Create material with uploaded URL
        await createMaterialMutation.mutateAsync({
          topicId,
          title: formData.title,
          description: formData.description,
          type: formData.type,
          url,
          fileSize: selectedFile.size,
          isRequired: formData.isRequired,
        });

        setIsUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao fazer upload do arquivo");
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!formData.title || !formData.url) {
      toast.error("Preencha título e URL");
      return;
    }

    createMaterialMutation.mutate({
      topicId,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      url: formData.url,
      isRequired: formData.isRequired,
    });
  };

  const handleDelete = (materialId: number, title: string) => {
    if (confirm(`Tem certeza que deseja remover o material "${title}"?`)) {
      deleteMaterialMutation.mutate({ id: materialId });
    }
  };

  const toggleRequired = (materialId: number, currentValue: boolean) => {
    updateMaterialMutation.mutate({
      id: materialId,
      isRequired: !currentValue,
    });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'link':
        return <LinkIcon className="h-5 w-5" />;
      case 'document':
        return <File className="h-5 w-5" />;
      case 'presentation':
        return <FileText className="h-5 w-5" />;
      default:
        return <Download className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper>
          <div className="container mx-auto py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando materiais...</p>
              </div>
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/learning-paths">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Trilhas
              </Button>
            </Link>
            <div className="text-sm text-gray-600 mb-2">
              {currentSubject?.name} → {currentTopic?.title}
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Materiais Didáticos
                </h1>
                <p className="text-gray-600">
                  Gerencie os materiais de estudo deste tópico
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Material
              </Button>
            </div>
          </div>

          {/* Materials List */}
          <Card>
            <CardHeader>
              <CardTitle>Materiais Disponíveis</CardTitle>
              <CardDescription>
                {materials?.length || 0} {materials?.length === 1 ? 'material' : 'materiais'} cadastrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!materials || materials.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum material cadastrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Adicione PDFs, vídeos, links e outros recursos para os alunos
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Material
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="mt-1 text-gray-600">
                        {getMaterialIcon(material.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{material.title}</h4>
                            {material.description && (
                              <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {material.type}
                              </Badge>
                              {material.fileSize && (
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(material.fileSize)}
                                </span>
                              )}
                              <a
                                href={material.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Abrir →
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`required-${material.id}`} className="text-xs cursor-pointer">
                                {material.isRequired ? (
                                  <Badge variant="default" className="text-xs">Obrigatório</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                                )}
                              </Label>
                              <Switch
                                id={`required-${material.id}`}
                                checked={material.isRequired}
                                onCheckedChange={() => toggleRequired(material.id, material.isRequired)}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(material.id, material.title)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Material Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Material Didático</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <Label>Tipo de Material</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as MaterialType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link Externo</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="presentation">Apresentação</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload or URL */}
                {formData.type === 'link' ? (
                  <div>
                    <Label>URL do Material</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Ex: YouTube, Google Drive, artigos, etc.
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label>Arquivo</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept={
                          formData.type === 'pdf' ? '.pdf' :
                          formData.type === 'video' ? 'video/*' :
                          formData.type === 'document' ? '.doc,.docx,.txt,.odt' :
                          formData.type === 'presentation' ? '.ppt,.pptx,.odp' :
                          '*'
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile ? selectedFile.name : 'Selecionar Arquivo'}
                      </Button>
                      {selectedFile && (
                        <p className="text-xs text-gray-600 mt-2">
                          Tamanho: {formatFileSize(selectedFile.size)}
                        </p>
                      )}
                    </div>
                    {isUploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Fazendo upload...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ex: Apostila de Introdução"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Descreva o conteúdo deste material..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Required Switch */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="required-switch">Material Obrigatório</Label>
                  <Switch
                    id="required-switch"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={formData.type === 'link' ? handleAddLink : handleUploadFile}
                  disabled={isUploading || createMaterialMutation.isPending}
                >
                  {isUploading || createMaterialMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
