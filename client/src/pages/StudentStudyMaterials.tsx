import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import {
  FileText,
  Video,
  LinkIcon,
  File,
  Loader2,
  Download,
  Presentation,
  FolderOpen,
  Eye,
  X,
  BookOpen,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function StudentStudyMaterials() {
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Queries
  const { data: materials = [], isLoading } = trpc.materials.listForStudent.useQuery();

  // Get unique subjects from materials
  const subjectsList = useMemo(() => {
    const subjectsMap = new Map<number, string>();
    materials.forEach((m: any) => {
      if (m.subjectId && m.subjectName) {
        subjectsMap.set(m.subjectId, m.subjectName);
      }
    });
    return Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name }));
  }, [materials]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let filtered = materials;
    if (filterSubject !== "all") {
      const subjectId = parseInt(filterSubject);
      filtered = filtered.filter((m: any) => m.subjectId === subjectId);
    }
    if (filterType !== "all") {
      filtered = filtered.filter((m: any) => m.type === filterType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m: any) =>
          m.title.toLowerCase().includes(term) ||
          (m.description && m.description.toLowerCase().includes(term))
      );
    }
    return filtered;
  }, [materials, filterSubject, filterType, searchTerm]);

  // Stats
  const totalMaterials = materials.length;
  const requiredCount = materials.filter((m: any) => m.isRequired).length;
  const optionalCount = totalMaterials - requiredCount;

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

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Materiais de Estudo</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Acesse os materiais disponibilizados pelos seus professores
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Total Disponível
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {totalMaterials}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Materiais disponíveis
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
                  Complementares
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
                    {subjectsList.map((s) => (
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
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                {filteredMaterials.length} material(is) encontrado(s)
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
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterSubject !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Seus professores ainda não disponibilizaram materiais de estudo"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMaterials.map((material: any) => (
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
                          {material.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {material.description}
                            </p>
                          )}
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
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">
                                Complementar
                              </Badge>
                            )}
                            {material.subjectName && (
                              <Badge variant="outline" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {material.subjectName}
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
                        {material.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(material.url, "_blank")}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
    </StudentLayout>
  );
}
