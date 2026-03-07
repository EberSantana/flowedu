import { useState, useRef, useEffect } from "react";
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
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";

type MaterialType = 'pdf' | 'video' | 'link' | 'document' | 'presentation' | 'other';

// Limite máximo de arquivo em bytes (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 100;

export default function TopicMaterialsManager() {
  const [, topicParams] = useRoute("/learning-paths/:subjectId/topic/:topicId/materials");
  const [, moduleParams] = useRoute("/learning-paths/:subjectId/module/:moduleId/materials");
  const params = topicParams || moduleParams;
  const subjectId = params?.subjectId ? parseInt(params.subjectId) : 0;
  const topicId = topicParams?.topicId ? parseInt(topicParams.topicId) : 0;
  const moduleId = moduleParams?.moduleId ? parseInt(moduleParams.moduleId) : 0;
  const isModuleMode = !!moduleId && !topicId;

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
  // Buscar uso e limite de armazenamento individual do professor logado
  const { data: myStorageInfo, refetch: refetchStorage } = trpc.materials.getMyStorageInfo.useQuery();
  const storageLimitMB = myStorageInfo?.limitMB || 1024;
  const storageUsedMB = myStorageInfo?.usedMB || 0;
  const storageFileCount = myStorageInfo?.fileCount || 0;

  const { data: subject } = trpc.subjects.list.useQuery();
  const currentSubject = subject?.find(s => s.id === subjectId);

  const { data: learningPath } = trpc.learningPath.getBySubject.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  const { data: topicMaterials, isLoading: loadingTopicMaterials } = trpc.materials.getByTopic.useQuery(
    { topicId },
    { enabled: !!topicId && !isModuleMode }
  );

  const { data: moduleMaterials, isLoading: loadingModuleMaterials } = trpc.materials.getByModule.useQuery(
    { moduleId },
    { enabled: !!moduleId && isModuleMode }
  );

  const materials = isModuleMode ? moduleMaterials : topicMaterials;
  const loadingMaterials = isModuleMode ? loadingModuleMaterials : loadingTopicMaterials;

  const utils = trpc.useUtils();



  const createMaterialMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      utils.materials.getByTopic.invalidate();
      refetchStorage();
      toast.success("Material adicionado com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar material: " + error.message);
    },
  });

  const createModuleMaterialMutation = trpc.materials.createForModule.useMutation({
    onSuccess: () => {
      utils.materials.getByModule.invalidate();
      refetchStorage();
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
      if (isModuleMode) {
        utils.materials.getByModule.invalidate();
      } else {
        utils.materials.getByTopic.invalidate();
      }
      toast.success("Material atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar material: " + error.message);
    },
  });

  const deleteMaterialMutation = trpc.materials.delete.useMutation({
    onSuccess: () => {
      if (isModuleMode) {
        utils.materials.getByModule.invalidate();
      } else {
        utils.materials.getByTopic.invalidate();
      }
      refetchStorage();
      toast.success("Material removido! Arquivo deletado do servidor.");
    },
    onError: (error) => {
      toast.error("Erro ao remover material: " + error.message);
    },
  });

  // Find current topic or module info
  const currentTopic = learningPath?.reduce((found: any, module: any) => {
    if (found) return found;
    return module.topics?.find((t: any) => t.id === topicId);
  }, null);

  const currentModule = isModuleMode ? learningPath?.find((m: any) => m.id === moduleId) : null;

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

    // Verificar limite de armazenamento individual do professor
    if (myStorageInfo) {
      const fileSizeMB = selectedFile.size / (1024 * 1024);
      if (storageUsedMB + fileSizeMB > storageLimitMB) {
        toast.error(`Limite de armazenamento atingido (${storageUsedMB.toFixed(1)} MB / ${storageLimitMB} MB). Remova materiais antigos ou contate o administrador.`);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Enviando arquivo...");
    setUploadError(null);

    try {
      // Usar FormData multipart (mais eficiente para arquivos grandes, sem overhead de base64)
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);

      setUploadProgress(10);
      setUploadStatus("Enviando para o servidor...");

      try {
        // Upload com XMLHttpRequest para ter progresso real
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 80) + 10;
              setUploadProgress(progress);
              setUploadStatus(`Enviando... ${Math.round((event.loaded / event.total) * 100)}%`);
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.url);
              } catch {
                reject(new Error('Resposta inválida do servidor'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.message || errorData.error || `Erro no upload (${xhr.status})`));
              } catch {
                reject(new Error(`Erro no upload (${xhr.status})`));
              }
            }
          };
          
          xhr.onerror = () => reject(new Error('Erro de conexão. Verifique sua internet e tente novamente.'));
          xhr.ontimeout = () => reject(new Error('O upload excedeu o tempo limite. Tente com um arquivo menor.'));
          xhr.timeout = 600000; // 10 minutos
          
          xhr.open('POST', '/api/upload-material');
          xhr.send(formDataUpload);
        });

        setUploadProgress(90);
        setUploadStatus("Salvando material...");

        // Create material with uploaded URL
        if (isModuleMode) {
          await createModuleMaterialMutation.mutateAsync({
            moduleId,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            url,
            fileSize: selectedFile.size,
            isRequired: formData.isRequired,
          });
        } else {
          await createMaterialMutation.mutateAsync({
            topicId,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            url,
            fileSize: selectedFile.size,
            isRequired: formData.isRequired,
          });
        }

        setUploadProgress(100);
        setUploadStatus("Concluído!");
        setIsUploading(false);
        
      } catch (uploadError: any) {
        console.error('Upload error:', uploadError);
        
        let errorMessage = "Erro ao fazer upload do arquivo.";
        
        if (uploadError.message?.includes('tempo limite') || uploadError.message?.includes('AbortError')) {
          errorMessage = "O upload excedeu o tempo limite. Tente com um arquivo menor ou verifique sua conexão.";
        } else if (uploadError.message?.includes('413') || uploadError.message?.includes('muito grande')) {
          errorMessage = `O arquivo é muito grande. O limite máximo é ${MAX_FILE_SIZE_MB}MB.`;
        } else if (uploadError.message) {
          errorMessage = uploadError.message;
        }
        
        setUploadError(errorMessage);
        toast.error(errorMessage);
        setIsUploading(false);
        setUploadStatus("");
      }
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

    if (isModuleMode) {
      createModuleMaterialMutation.mutate({
        moduleId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.url,
        isRequired: formData.isRequired,
      });
    } else {
      createMaterialMutation.mutate({
        topicId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        url: formData.url,
        isRequired: formData.isRequired,
      });
    }
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
              onClick={() => setLocation(`/learning-paths`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Trilha
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isModuleMode ? "Materiais do Módulo" : "Materiais do Tópico"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isModuleMode ? (currentModule?.title || "Carregando...") : (currentTopic?.title || "Carregando...")} • {currentSubject?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isModuleMode ? "Gerencie os materiais de estudo deste módulo" : "Gerencie os materiais de estudo deste tópico"}
                </p>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Material
              </Button>
            </div>
          </div>

          {/* Storage Info with Progress Bar - Limite Individual */}
          {myStorageInfo && (() => {
            const usedPercent = storageLimitMB > 0 ? (storageUsedMB / storageLimitMB) * 100 : 0;
            const barColor = usedPercent >= 90 ? 'bg-red-500' : usedPercent >= 70 ? 'bg-amber-500' : 'bg-primary';
            const textColor = usedPercent >= 90 ? 'text-red-600' : usedPercent >= 70 ? 'text-amber-600' : 'text-green-600';
            const limitLabel = storageLimitMB >= 1024 ? `${(storageLimitMB / 1024).toFixed(storageLimitMB % 1024 === 0 ? 0 : 1)} GB` : `${storageLimitMB} MB`;
            return (
              <div className="mb-4 bg-muted/50 px-4 py-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    <span>
                      <strong className={textColor}>{storageUsedMB.toFixed(1)} MB</strong> de <strong className="text-foreground">{limitLabel}</strong>
                      <span className="ml-2 text-xs">({storageFileCount} arquivo{storageFileCount !== 1 ? 's' : ''})</span>
                    </span>
                  </div>
                  <Badge variant={usedPercent >= 90 ? 'destructive' : usedPercent >= 70 ? 'secondary' : 'default'}>
                    {usedPercent.toFixed(1)}%
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  />
                </div>
                {usedPercent >= 80 && usedPercent < 90 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Seu armazenamento está ficando cheio. Considere remover materiais antigos.</span>
                  </div>
                )}
                {usedPercent >= 90 && usedPercent < 100 && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Armazenamento quase cheio! Remova materiais antigos para liberar espaço.</span>
                  </div>
                )}
                {usedPercent >= 100 && (
                  <div className="flex items-center gap-2 text-xs text-red-700 font-semibold">
                    <AlertCircle className="h-3 w-3" />
                    <span>Limite atingido! Não é possível enviar novos arquivos. Contate o administrador.</span>
                  </div>
                )}
              </div>
            );
          })()}

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
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Material Didático</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>Tipo de Material</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as MaterialType })}
                  >
                    <SelectTrigger className="w-full">
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
                  <div className="space-y-2">
                    <Label>URL do Material</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: YouTube, Google Drive, artigos, etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <div className="space-y-2">
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
                        className="w-full justify-start text-left font-normal truncate"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{selectedFile ? selectedFile.name : "Selecionar Arquivo"}</span>
                      </Button>
                      
                      {/* Informação de tamanho */}
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground">
                          Tamanho: {formatFileSize(selectedFile.size)}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Tamanho máximo: {MAX_FILE_SIZE_MB}MB. Para arquivos maiores, use um link externo (Google Drive, YouTube, etc.)
                      </p>
                      
                      {/* Erro de upload */}
                      {uploadError && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-destructive">{uploadError}</p>
                        </div>
                      )}
                      
                      {/* Progresso de upload */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{uploadStatus}</span>
                            <span className="font-medium">{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="Nome do material"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    placeholder="Breve descrição do material"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full resize-none"
                    rows={3}
                  />
                </div>

                {/* Required Switch */}
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="required-switch" className="cursor-pointer">Material Obrigatório</Label>
                  <Switch
                    id="required-switch"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>
                  Cancelar
                </Button>
                <Button
                  onClick={formData.type === 'link' ? handleAddLink : handleUploadFile}
                  disabled={isUploading || createMaterialMutation.isPending || !!uploadError || (formData.type !== 'link' && myStorageInfo ? storageUsedMB >= storageLimitMB : false)}
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
