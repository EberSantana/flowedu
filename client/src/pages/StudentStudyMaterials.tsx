import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import {
  FileText, Video, LinkIcon, File, Loader2, Download, Presentation,
  FolderOpen, Eye, X, BookOpen, Filter, Search, Folder,
  ChevronDown, ChevronRight, Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(type: string) {
  switch (type) {
    case "pdf": return <FileText className="h-5 w-5 text-red-500" />;
    case "video": return <Video className="h-5 w-5 text-purple-500" />;
    case "link": return <LinkIcon className="h-5 w-5 text-blue-500" />;
    case "presentation": return <Presentation className="h-5 w-5 text-orange-500" />;
    case "document": return <FileText className="h-5 w-5 text-blue-600" />;
    case "audio": return <Music className="h-5 w-5 text-green-500" />;
    default: return <File className="h-5 w-5 text-gray-500" />;
  }
}

function getTypeBadge(type: string) {
  const labels: Record<string, string> = {
    pdf: "PDF", video: "Vídeo", link: "Link", presentation: "Apresentação", document: "Documento", audio: "Áudio", other: "Outro",
  };
  return labels[type] || type;
}

const SUBJECT_COLORS = [
  "#0d9488", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#6366f1",
  "#f97316", "#06b6d4", "#84cc16", "#a855f7",
];

export default function StudentStudyMaterials() {
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());

  // Queries
  const { data: materials = [], isLoading } = trpc.materials.listForStudent.useQuery();

  // Track download mutation
  const trackDownload = trpc.materials.trackDownload.useMutation();

  // Get unique subjects from materials
  const subjectsList = useMemo(() => {
    const subjectsMap = new Map<number, string>();
    materials.forEach((m: any) => {
      if (m.subjectId && m.subjectName) subjectsMap.set(m.subjectId, m.subjectName);
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
    if (filterType !== "all") filtered = filtered.filter((m: any) => m.type === filterType);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((m: any) => m.title.toLowerCase().includes(term) || (m.description && m.description.toLowerCase().includes(term)));
    }
    return filtered;
  }, [materials, filterSubject, filterType, searchTerm]);

  // Group materials by subject
  const groupedBySubject = useMemo(() => {
    const groups: { subjectId: number | null; subjectName: string; color: string; materials: typeof filteredMaterials }[] = [];
    const subjectMap = new Map<number | null, typeof filteredMaterials>();

    filteredMaterials.forEach((m: any) => {
      const key = m.subjectId || null;
      if (!subjectMap.has(key)) subjectMap.set(key, []);
      subjectMap.get(key)!.push(m);
    });

    // Sort: subjects first, "Sem Disciplina" last
    const subjectEntries = Array.from(subjectMap.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return 0;
    });

    let colorIdx = 0;
    subjectEntries.forEach(([subjectId, mats]) => {
      const subjectName = subjectId
        ? (subjectsList.find((s) => s.id === subjectId)?.name || `Disciplina #${subjectId}`)
        : "Materiais Gerais";
      const color = subjectId ? SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length] : "#94a3b8";
      if (subjectId) colorIdx++;
      groups.push({ subjectId, subjectName, color, materials: mats });
    });

    return groups;
  }, [filteredMaterials, subjectsList]);

  // Stats
  const totalMaterials = materials.length;
  const requiredCount = materials.filter((m: any) => m.isRequired).length;
  const optionalCount = totalMaterials - requiredCount;

  function toggleSubjectCollapse(key: string) {
    setCollapsedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function canPreview(type: string, url: string): boolean {
    return (type === "pdf" || type === "video" || type === "audio" || type === "image" || type === "document" || type === "presentation" || (type === "link" && !!url));
  }

  function getYouTubeEmbedUrl(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0`;
    }
    return null;
  }

  function getPreviewSrc(type: string, url: string): string {
    if (type === "pdf" || type === "document" || type === "presentation") {
      // Usar proxy local para evitar bloqueio de iframe (CloudFront, CORS, X-Frame-Options)
      // URLs locais (/uploads/...) são servidas diretamente; externas passam pelo proxy
      if (url.startsWith('/') || url.startsWith(window.location.origin)) {
        return url;
      }
      return `/api/file-proxy?url=${encodeURIComponent(url)}`;
    }
    if (type === "link") {
      const ytEmbed = getYouTubeEmbedUrl(url);
      if (ytEmbed) return ytEmbed;
    }
    return url;
  }

  function handlePreview(material: { type: string; url: string; title: string }) {
    setPreviewLoading(true);
    setPreviewUrl(material.url); setPreviewType(material.type); setPreviewTitle(material.title);
  }

  function handleDownload(material: any) {
    trackDownload.mutate({ materialId: material.id });
    window.open(material.url, "_blank");
    toast.success("Download iniciado!");
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <FolderOpen className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Materiais de Estudo</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Materiais organizados por disciplina
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Disponível</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalMaterials}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Obrigatórios</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{requiredCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <File className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Complementares</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{optionalCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todas as disciplinas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    {subjectsList.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Materiais Agrupados por Disciplina */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : groupedBySubject.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum material encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterSubject !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Seus professores ainda não disponibilizaram materiais de estudo"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedBySubject.map((group) => {
                const key = group.subjectId ? String(group.subjectId) : "none";
                const isCollapsed = collapsedSubjects.has(key);

                return (
                  <Card key={key} className="overflow-hidden">
                    {/* Header da Disciplina (Pasta) */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      style={{ borderLeft: `4px solid ${group.color}` }}
                      onClick={() => toggleSubjectCollapse(key)}
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Folder className="h-6 w-6" style={{ color: group.color }} />
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{group.subjectName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.materials.length} material(is)
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {group.materials.length}
                      </Badge>
                    </div>

                    {/* Lista de Materiais dentro da Disciplina */}
                    {!isCollapsed && (
                      <div className="border-t">
                        <div className="divide-y">
                          {group.materials.map((material: any) => (
                            <div key={material.id} className="flex items-center justify-between py-3 px-6 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="flex-shrink-0">{getFileIcon(material.type)}</div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-foreground truncate">{material.title}</h4>
                                  {material.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{material.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <Badge variant="secondary" className="text-xs">{getTypeBadge(material.type)}</Badge>
                                    <span className="text-xs text-muted-foreground">{formatFileSize(material.fileSize)}</span>
                                    {material.isRequired ? (
                                      <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">Obrigatório</Badge>
                                    ) : (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-xs">Complementar</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                {canPreview(material.type, material.url) && (
                                  <Button variant="ghost" size="icon" onClick={() => handlePreview(material)} title="Pré-visualizar">
                                    <Eye className="h-4 w-4 text-primary" />
                                  </Button>
                                )}
                                {material.url && (
                                  <Button variant="outline" size="sm" onClick={() => handleDownload(material)}>
                                    <Download className="h-4 w-4 mr-2" /> Baixar
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Pré-visualização */}
      <Dialog open={!!previewUrl} onOpenChange={() => { setPreviewUrl(null); setPreviewLoading(false); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="w-full relative" style={{ minHeight: "500px" }}>
            {previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Carregando pré-visualização...</span>
                </div>
              </div>
            )}
            {(previewType === "pdf" || previewType === "document" || previewType === "presentation") && previewUrl && (
              <iframe
                src={getPreviewSrc(previewType, previewUrl)}
                className="w-full rounded-lg border"
                style={{ height: "70vh" }}
                title={previewTitle}
                allow="fullscreen"
                onLoad={() => setPreviewLoading(false)}
              />
            )}
            {previewType === "video" && previewUrl && (
              <video src={previewUrl} controls className="w-full rounded-lg" style={{ maxHeight: "70vh" }} onLoadedData={() => setPreviewLoading(false)}>Seu navegador não suporta reprodução de vídeo.</video>
            )}
            {previewType === "audio" && previewUrl && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="bg-primary/10 rounded-full p-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
                <audio src={previewUrl} controls className="w-full max-w-lg" onLoadedData={() => setPreviewLoading(false)}>
                  Seu navegador não suporta reprodução de áudio.
                </audio>
              </div>
            )}
            {previewType === "image" && previewUrl && (
              <img src={previewUrl} alt={previewTitle} className="w-full rounded-lg object-contain" style={{ maxHeight: "70vh" }} onLoad={() => setPreviewLoading(false)} />
            )}
            {previewType === "link" && previewUrl && (() => {
              const ytEmbed = getYouTubeEmbedUrl(previewUrl);
              return ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh" }}
                  title={previewTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  onLoad={() => setPreviewLoading(false)}
                />
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh" }}
                  title={previewTitle}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  onLoad={() => setPreviewLoading(false)}
                />
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewUrl(null); setPreviewLoading(false); }}><X className="mr-2 h-4 w-4" />Fechar</Button>
            {previewUrl && (<Button onClick={() => window.open(previewUrl, "_blank")}><Download className="mr-2 h-4 w-4" />Abrir em Nova Aba</Button>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
