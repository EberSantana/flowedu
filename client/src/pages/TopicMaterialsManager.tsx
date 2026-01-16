import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Video,
  LinkIcon,
  Download,
  File,
  Upload,
  Loader2,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type MaterialType = 'pdf' | 'video' | 'link' | 'document' | 'presentation' | 'other';

// Limite máximo de arquivo em bytes (75MB - deixando margem para base64)
const MAX_FILE_SIZE = 75 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 75;

export default function TopicMaterialsManager() {
  const [, params] = useRoute("/learning-paths/:subjectId/topic/:topicId/materials");
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const topicId = params?.topicId ? parseInt(params.topicId) : 0;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const { data: materials, isLoading: loadingMaterials } = trpc.materials.getByTopic.useQuery(
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
    setUploadProgress(0);
    setUploadStatus("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (file) {
      // Validar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`O arquivo é muito grande (${formatFileSize(file.size)}). O limite máximo é ${MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
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

    // Validação adicional de tamanho
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`O arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Lendo arquivo...");
    setUploadError(null);

    try {
      // Convert file to base64 for upload
      const reader = new FileReader();
      
      reader.onerror = () => {
        setUploadError("Erro ao ler o arquivo. Tente novamente.");
        setIsUploading(false);
        setUploadStatus("");
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 30);
          setUploadProgress(progress);
          setUploadStatus(`Lendo arquivo... ${progress}%`);
        }
      };
      
      reader.onload = async (e) => {
        setUploadProgress(35);
        setUploadStatus("Preparando upload...");

        const base64Data = e.target?.result as string;
        const fileKey = `materials/${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        try {
          setUploadProgress(40);
          setUploadStatus("Enviando para o servidor...");
          
          // Upload to S3 via API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutos de timeout
          
          const response = await fetch('/api/upload-material', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileKey,
              fileData: base64Data,
              contentType: selectedFile.type,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.message || errorData.error || `Erro no upload (${response.status})`);
          }

          setUploadProgress(90);
          setUploadStatus("Finalizando...");

          const { url } = await response.json();
          setUploadProgress(95);
          setUploadStatus("Salvando material...");

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

          setUploadProgress(100);
          setUploadStatus("Concluído!");
          setIsUploading(false);
          
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          
          let errorMessage = "Erro ao fazer upload do arquivo.";
          
          if (uploadError.name === 'AbortError') {
            errorMessage = "O upload excedeu o tempo limite. Tente com um arquivo menor ou verifique sua conexão.";
          } else if (uploadError.message.includes('413') || uploadError.message.includes('too large')) {
            errorMessage = `O arquivo é muito grande. O limite máximo é ${MAX_FILE_SIZE_MB}MB.`;
          } else if (uploadError.message) {
            errorMessage = uploadError.message;
          }
          
          setUploadError(errorMessage);
          toast.error(errorMessage);
          setIsUploading(false);
          setUploadStatus("");
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError("Erro inesperado ao processar o arquivo.");
      toast.error("Erro ao fazer upload do arquivo");
      setIsUploading(false);
      setUploadStatus("");
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

  const [, setLocation] = useLocation();

  return (
    <PageWrapper className="bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/learning-paths/${subjectId}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Trilha
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Materiais do Tópico
                </h1>
                <p className="text-gray-600 mt-1">
                  {currentTopic?.title || "Carregando..."} • {currentSubject?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
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
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
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
                                {material.type === 'pdf' ? 'PDF' :
                                 material.type === 'video' ? 'Vídeo' :
                                 material.type === 'link' ? 'Link' :
                                 material.type === 'document' ? 'Documento' :
                                 material.type === 'presentation' ? 'Apresentação' :
                                 'Outro'}
                              </Badge>
                              {material.fileSize && (
                                <span className="text-xs text-gray-500">
                                  {formatFileSize(material.fileSize)}
                                </span>
                              )}
                              {material.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRequired(material.id, material.isRequired || false)}
                            >
                              {material.isRequired ? 'Tornar Opcional' : 'Tornar Obrigatório'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(material.id, material.title)}
                            >
                              <Trash2 className="h-4 w-4" />
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
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsAddDialogOpen(open);
          }}>
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
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile ? selectedFile.name : "Selecionar Arquivo"}
                      </Button>
                      
                      {/* Informação de tamanho */}
                      {selectedFile && (
                        <p className="text-xs text-gray-600 mt-2">
                          Tamanho: {formatFileSize(selectedFile.size)}
                        </p>
                      )}
                      
                      {/* Erro de upload */}
                      {uploadError && (
                        <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <p className="text-sm text-red-700">{uploadError}</p>
                        </div>
                      )}
                      
                      {/* Progresso de upload */}
                      {isUploading && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{uploadStatus}</span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Tamanho máximo: {MAX_FILE_SIZE_MB}MB. Para arquivos maiores, use um link externo (Google Drive, YouTube, etc.)
                      </p>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <Label>Título</Label>
                  <Input
                    placeholder="Nome do material"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Breve descrição do material"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button
                  onClick={formData.type === 'link' ? handleAddLink : handleUploadFile}
                  disabled={isUploading || createMaterialMutation.isPending || !!uploadError}
                >
                  {isUploading || createMaterialMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadStatus || "Processando..."}
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
      </div>
    </PageWrapper>
  );
}
