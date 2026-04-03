import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Video,
  LinkIcon,
  File,
  Upload,
  Loader2,
  ArrowLeft,
  Trash2,
  HardDrive,
  Filter,
  Plus,
  Download,
  Presentation,
  FolderOpen,
  Eye,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Breadcrumb } from "@/components/Breadcrumb";

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "video":
      return <Video className="h-5 w-5 text-purple-500" />;
    case "link":
      return <LinkIcon className="h-5 w-5 text-blue-500" />;
    case "presentation":
      return <Presentation className="h-5 w-5 text-orange-500" />;
    case "document":
      return <FileText className="h-5 w-5 text-blue-600" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
}

function getTypeBadge(type: string) {
  const labels: Record<string, string> = {
    pdf: "PDF",
    video: "Vídeo",
    link: "Link",
    presentation: "Apresentação",
    document: "Documento",
    other: "Outro",
  };
  return labels[type] || type;
}

export default function TeacherStudyMaterials() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "pdf" as "pdf" | "video" | "link" | "presentation" | "document" | "other",
    url: "",
    isRequired: false,
    topicId: 0,
    subjectId: "" as string,
  });
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);

  // Queries
  const { data: allMaterials = [], isLoading, refetch } = trpc.materials.listAll.useQuery();
  const { data: storageInfo } = trpc.materials.getMyStorageInfo.useQuery();
  const { data: subjects = [] } = trpc.subjects.list.useQuery();

  // Mutations
  const createMaterial = trpc.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado com sucesso!");
      refetch();
      setShowAddDialog(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMaterial = trpc.materials.delete.useMutation({
    onSuccess: () => {
      toast.success("Material removido com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMaterial = trpc.materials.update.useMutation({
    onSuccess: () => {
      toast.success("Material atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSubject = trpc.materials.updateSubject.useMutation({
    onSuccess: () => {
      toast.success("Disciplina atualizada!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let filtered = allMaterials;
    if (filterType !== "all") {
      filtered = filtered.filter((m) => m.type === filterType);
    }
    if (filterSubject !== "all") {
      const subjectId = parseInt(filterSubject);
      filtered = filtered.filter((m) => m.subjectId === subjectId);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          (m.description && m.description.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [allMaterials, filterType, filterSubject, searchTerm]);

  // Stats
  const totalMaterials = allMaterials.length;
  const requiredCount = allMaterials.filter((m) => m.isRequired).length;
  const optionalCount = totalMaterials - requiredCount;

  // Storage calculations
  const usedMB = storageInfo?.usedMB || 0;
  const limitMB = storageInfo?.limitMB || 2048;
  const fileCount = storageInfo?.fileCount || 0;
  const usagePercent = limitMB > 0 ? Math.min((usedMB / limitMB) * 100, 100) : 0;

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      type: "pdf",
      url: "",
      isRequired: false,
      topicId: 0,
      subjectId: "",
    });
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect type from extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    let type: typeof formData.type = "other";
    if (ext === "pdf") type = "pdf";
    else if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) type = "video";
    else if (["pptx", "ppt", "key"].includes(ext)) type = "presentation";
    else if (["doc", "docx", "txt", "odt"].includes(ext)) type = "document";

    setSelectedFile(file);
    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      type,
    }));
  }

  function canPreview(type: string, url: string): boolean {
    if (type === "pdf" || type === "video") return true;
    if (type === "link" && url) return true;
    return false;
  }

  function handlePreview(material: { type: string; url: string; title: string }) {
    setPreviewUrl(material.url);
    setPreviewType(material.type);
    setPreviewTitle(material.title);
  }

  async function handleSubmit() {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    const subjectIdNum = formData.subjectId ? parseInt(formData.subjectId) : undefined;

    if (formData.type === "link") {
      if (!formData.url.trim()) {
        toast.error("URL é obrigatória para links");
        return;
      }
      createMaterial.mutate({
        topicId: formData.topicId || 1,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        url: formData.url,
        isRequired: formData.isRequired,
      });
      // Update subject after creation
      if (subjectIdNum) {
        setTimeout(() => {
          const latest = allMaterials[0];
          if (latest) {
            updateSubject.mutate({ materialId: latest.id, subjectId: subjectIdNum });
          }
        }, 500);
      }
      return;
    }

    if (!selectedFile) {
      toast.error("Selecione um arquivo para upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);

      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `Erro no upload (${xhr.status})`));
            } catch {
              reject(new Error(`Erro no upload (${xhr.status})`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Erro de rede durante o upload"));
        xhr.ontimeout = () => reject(new Error("Timeout no upload"));
        xhr.open("POST", "/api/upload-material");
        xhr.send(formDataUpload);
      });

      createMaterial.mutate({
        topicId: formData.topicId || 1,
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        url: uploadedUrl,
        fileSize: selectedFile.size,
        isRequired: formData.isRequired,
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>

          <Breadcrumb
            items={[
              { label: "Conteúdo" },
              { label: "Materiais de Estudo" },
            ]}
          />

          {/* Header */}
          <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-primary" />
                Materiais de Estudo
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie os materiais de estudo disponíveis para seus alunos
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Material
            </Button>
          </div>

          {/* Barra de Armazenamento */}
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <span>
                    <span className="text-primary font-bold">
                      {usedMB.toFixed(1)} MB
                    </span>{" "}
                    de{" "}
                    <span className="font-bold">
                      {limitMB >= 1024 ? `${(limitMB / 1024).toFixed(0)} GB` : `${limitMB} MB`}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({fileCount} arquivo{fileCount !== 1 ? "s" : ""})
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    usagePercent > 90
                      ? "bg-red-100 text-red-700 border-red-300"
                      : usagePercent > 70
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-emerald-100 text-emerald-700 border-emerald-300"
                  }
                >
                  {usagePercent.toFixed(1)}%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    usagePercent > 90
                      ? "bg-red-500"
                      : usagePercent > 70
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Total de Materiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {totalMaterials}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Materiais cadastrados
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  Obrigatórios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {requiredCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Leitura obrigatória
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <File className="h-4 w-4 text-emerald-500" />
                  Opcionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {optionalCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Material complementar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Filtrar:
                  </span>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todas as disciplinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjects.map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Materiais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Materiais Disponíveis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredMaterials.length} material(is) cadastrado(s)
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum material encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || filterType !== "all" || filterSubject !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Adicione materiais de estudo para seus alunos"}
                  </p>
                  {!searchTerm && filterType === "all" && filterSubject === "all" && (
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Material
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between py-4 px-2 hover:bg-muted/30 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(material.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-foreground truncate">
                            {material.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {getTypeBadge(material.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(material.fileSize)}
                            </span>
                            {material.isRequired ? (
                              <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                                Obrigatório
                              </Badge>
                            ) : null}
                            {(material as any).subjectName && (
                              <Badge variant="outline" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {(material as any).subjectName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {/* Pré-visualização */}
                        {canPreview(material.type, material.url) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(material)}
                            title="Pré-visualizar"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateMaterial.mutate({
                              id: material.id,
                              isRequired: !material.isRequired,
                            })
                          }
                        >
                          {material.isRequired
                            ? "Tornar Opcional"
                            : "Tornar Obrigatório"}
                        </Button>
                        {material.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(material.url, "_blank")}
                            title="Baixar/Abrir"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este material?")) {
                              deleteMaterial.mutate({ id: material.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>

      {/* Dialog de Pré-visualização */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="w-full" style={{ minHeight: "500px" }}>
            {previewType === "pdf" && previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full rounded-lg border"
                style={{ height: "70vh" }}
                title={previewTitle}
              />
            )}
            {previewType === "video" && previewUrl && (
              <video
                src={previewUrl}
                controls
                className="w-full rounded-lg"
                style={{ maxHeight: "70vh" }}
              >
                Seu navegador não suporta reprodução de vídeo.
              </video>
            )}
            {previewType === "link" && previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full rounded-lg border"
                style={{ height: "70vh" }}
                title={previewTitle}
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}>
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
            {previewUrl && (
              <Button onClick={() => window.open(previewUrl, "_blank")}>
                <Download className="mr-2 h-4 w-4" />
                Abrir em Nova Aba
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Material */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Adicionar Material
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Seletor de Disciplina */}
            <div>
              <Label>Disciplina</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, subjectId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a disciplina (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Material</Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: val as typeof formData.type,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "link" ? (
              <div>
                <Label>URL do Link</Label>
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
            ) : (
              <div>
                <Label>Arquivo</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.avi,.mov,.txt,.odt,.key,.mkv"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Título</Label>
              <Input
                placeholder="Nome do material"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Breve descrição do material..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Material Obrigatório</Label>
              <Switch
                checked={formData.isRequired}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isRequired: checked }))
                }
              />
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Enviando...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || createMaterial.isPending}
            >
              {uploading || createMaterial.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Adicionar Material
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
