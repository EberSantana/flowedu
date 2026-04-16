import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  FileText, Video, LinkIcon, File, Upload, Loader2, ArrowLeft, Trash2,
  HardDrive, Filter, Plus, Download, Presentation, FolderOpen, Eye, X,
  BookOpen, FolderPlus, Folder, MoveRight, BarChart3, ChevronDown, ChevronRight, Tag,
  Music, ImageIcon, CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
    case "pdf": return <FileText className="h-5 w-5 text-red-500" />;
    case "video": return <Video className="h-5 w-5 text-purple-500" />;
    case "link": return <LinkIcon className="h-5 w-5 text-blue-500" />;
    case "presentation": return <Presentation className="h-5 w-5 text-orange-500" />;
    case "document": return <FileText className="h-5 w-5 text-blue-600" />;
    case "audio": return <Music className="h-5 w-5 text-green-500" />;
    case "image": return <ImageIcon className="h-5 w-5 text-pink-500" />;
    default: return <File className="h-5 w-5 text-gray-500" />;
  }
}

function getTypeBadge(type: string) {
  const labels: Record<string, string> = {
    pdf: "PDF", video: "Vídeo", link: "Link", presentation: "Apresentação", document: "Documento", audio: "Áudio", image: "Imagem", other: "Outro",
  };
  return labels[type] || type;
}

const SUBJECT_COLORS = [
  "#0d9488", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#10b981", "#6366f1",
  "#f97316", "#06b6d4", "#84cc16", "#a855f7",
];

type MaterialItem = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  url: string;
  fileSize: number | null;
  isRequired: boolean;
  topicId: number | null;
  moduleId: number | null;
  subjectId: number | null;
  folderId: number | null;
  downloadCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  subjectName: string | null;
  folderName: string | null;
  folderColor: string | null;
};

type FolderItem = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  subjectId: number | null;
  orderIndex: number;
};

// Renderiza um material individual
function MaterialRow({
  material,
  onPreview,
  onDelete,
  onAssignSubject,
  onMoveToFolder,
  canPreviewFn,
}: {
  material: MaterialItem;
  onPreview: (m: MaterialItem) => void;
  onDelete: (id: number) => void;
  onAssignSubject: (id: number) => void;
  onMoveToFolder: (id: number) => void;
  canPreviewFn: (type: string, url: string) => boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-6 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0">{getFileIcon(material.type)}</div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground truncate">{material.title}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">{getTypeBadge(material.type)}</Badge>
            <span className="text-xs text-muted-foreground">{formatFileSize(material.fileSize)}</span>
            {material.isRequired && (
              <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">Obrigatório</Badge>
            )}
            {!material.subjectId && (
              <Button variant="outline" size="sm" className="h-6 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={(e) => { e.stopPropagation(); onAssignSubject(material.id); }}>
                <Tag className="h-3 w-3 mr-1" /> Associar Disciplina
              </Button>
            )}
            {(material.downloadCount || 0) > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Download className="h-3 w-3" /> {material.downloadCount}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        <Button variant="ghost" size="icon" onClick={() => onMoveToFolder(material.id)} title="Mover para pasta">
          <MoveRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        {canPreviewFn(material.type, material.url) && (
          <Button variant="ghost" size="icon" onClick={() => onPreview(material)} title="Pré-visualizar">
            <Eye className="h-4 w-4 text-primary" />
          </Button>
        )}
        {material.url && (
          <Button variant="ghost" size="icon" onClick={() => window.open(material.url, "_blank")} title="Baixar/Abrir">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
          onClick={() => { if (confirm("Remover este material?")) onDelete(material.id); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TeacherStudyMaterials() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState<number | null>(null);
  const [showAssignSubjectDialog, setShowAssignSubjectDialog] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [collapsedSubjects, setCollapsedSubjects] = useState<Set<string>>(new Set());
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", description: "", type: "pdf" as "pdf" | "video" | "link" | "presentation" | "document" | "audio" | "image" | "other",
    url: "", isRequired: false, topicId: 0, subjectId: "" as string, folderId: "" as string,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: "", description: "", color: "#0d9488", subjectId: "" as string });
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);

  // Queries
  const { data: allMaterials = [], isLoading, refetch } = trpc.materials.listAll.useQuery();
  const { data: storageInfo } = trpc.materials.getMyStorageInfo.useQuery();
  const { data: subjectsWithClass = [] } = trpc.subjects.listWithClass.useQuery();
  const { data: folders = [], refetch: refetchFolders } = trpc.materials.listFolders.useQuery();

  // Mutations
  const createMaterial = trpc.materials.create.useMutation({
    onSuccess: () => { toast.success("Material adicionado com sucesso!"); refetch(); setShowAddDialog(false); resetForm(); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteMaterial = trpc.materials.delete.useMutation({
    onSuccess: () => { toast.success("Material removido!"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateMaterial = trpc.materials.update.useMutation({
    onSuccess: () => { toast.success("Material atualizado!"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const updateSubject = trpc.materials.updateSubject.useMutation({
    onSuccess: () => { toast.success("Disciplina atualizada!"); refetch(); setShowAssignSubjectDialog(null); },
    onError: (err: any) => toast.error(err.message),
  });
  const createFolder = trpc.materials.createFolder.useMutation({
    onSuccess: () => { toast.success("Pasta criada!"); refetchFolders(); setShowFolderDialog(false); setFolderForm({ name: "", description: "", color: "#0d9488", subjectId: "" }); },
    onError: (err: any) => toast.error(err.message),
  });
  const deleteFolder = trpc.materials.deleteFolder.useMutation({
    onSuccess: () => { toast.success("Pasta removida!"); refetchFolders(); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const moveToFolder = trpc.materials.moveToFolder.useMutation({
    onSuccess: () => { toast.success("Material movido!"); refetch(); setShowMoveDialog(null); },
    onError: (err: any) => toast.error(err.message),
  });

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    let filtered = allMaterials as MaterialItem[];
    if (filterType !== "all") filtered = filtered.filter((m) => m.type === filterType);
    if (filterSubject !== "all") {
      if (filterSubject === "none") {
        filtered = filtered.filter((m) => !m.subjectId);
      } else {
        const subjectId = parseInt(filterSubject);
        filtered = filtered.filter((m) => m.subjectId === subjectId);
      }
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(term) || (m.description && m.description.toLowerCase().includes(term)));
    }
    return filtered;
  }, [allMaterials, filterType, filterSubject, searchTerm]);

  // Group materials by subject, then by folder within each subject
  type SubjectGroup = {
    subjectId: number | null;
    subjectName: string;
    color: string;
    looseMaterials: MaterialItem[];
    folders: { folder: FolderItem; materials: MaterialItem[] }[];
    totalCount: number;
  };

  const groupedBySubject = useMemo(() => {
    const groups: SubjectGroup[] = [];
    const subjectMap = new Map<number | null, { loose: MaterialItem[]; folderMap: Map<number, MaterialItem[]> }>();

    filteredMaterials.forEach((m) => {
      const subKey = m.subjectId || null;
      if (!subjectMap.has(subKey)) subjectMap.set(subKey, { loose: [], folderMap: new Map() });
      const entry = subjectMap.get(subKey)!;
      if (m.folderId) {
        if (!entry.folderMap.has(m.folderId)) entry.folderMap.set(m.folderId, []);
        entry.folderMap.get(m.folderId)!.push(m);
      } else {
        entry.loose.push(m);
      }
    });

    // Also add empty folders
    (folders as FolderItem[]).forEach((folder) => {
      const subKey = folder.subjectId || null;
      if (!subjectMap.has(subKey)) subjectMap.set(subKey, { loose: [], folderMap: new Map() });
      const entry = subjectMap.get(subKey)!;
      if (!entry.folderMap.has(folder.id)) entry.folderMap.set(folder.id, []);
    });

    const subjectEntries = Array.from(subjectMap.entries()).sort((a, b) => {
      if (a[0] === null) return 1;
      if (b[0] === null) return -1;
      return 0;
    });

    let colorIdx = 0;
    subjectEntries.forEach(([subjectId, data]) => {
      const subjectName = subjectId
        ? ((subjectsWithClass as any[]).find((s: any) => s.id === subjectId)?.label || `Disciplina #${subjectId}`)
        : "Sem Disciplina Associada";
      const color = subjectId ? SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length] : "#94a3b8";
      if (subjectId) colorIdx++;

      const folderList: SubjectGroup["folders"] = [];
      data.folderMap.forEach((materials, folderId) => {
        const folderInfo = (folders as FolderItem[]).find((f) => f.id === folderId);
        if (folderInfo) {
          folderList.push({ folder: folderInfo, materials });
        } else {
          data.loose.push(...materials);
        }
      });

      folderList.sort((a, b) => a.folder.orderIndex - b.folder.orderIndex);

      const totalCount = data.loose.length + folderList.reduce((sum, f) => sum + f.materials.length, 0);

      if (totalCount > 0 || folderList.length > 0) {
        groups.push({ subjectId, subjectName, color, looseMaterials: data.loose, folders: folderList, totalCount });
      }
    });

    return groups;
  }, [filteredMaterials, subjectsWithClass, folders]);

  // Stats
  const totalMaterials = (allMaterials as MaterialItem[]).length;
  const requiredCount = (allMaterials as MaterialItem[]).filter((m) => m.isRequired).length;
  const totalDownloads = (allMaterials as MaterialItem[]).reduce((sum, m) => sum + (m.downloadCount || 0), 0);
  const noSubjectCount = (allMaterials as MaterialItem[]).filter((m) => !m.subjectId).length;
  const totalFolders = (folders as FolderItem[]).length;

  const usedMB = storageInfo?.usedMB || 0;
  const limitMB = storageInfo?.limitMB || 2048;
  const fileCount = storageInfo?.fileCount || 0;
  const usagePercent = limitMB > 0 ? Math.min((usedMB / limitMB) * 100, 100) : 0;

  function toggleSubjectCollapse(key: string) {
    setCollapsedSubjects((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  function toggleFolderCollapse(key: string) {
    setCollapsedFolders((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  function resetForm() {
    setFormData({ title: "", description: "", type: "pdf", url: "", isRequired: false, topicId: 0, subjectId: "", folderId: "" });
    setSelectedFile(null); setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function detectFileType(file: globalThis.File): typeof formData.type {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "pdf";
    if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) return "video";
    if (["pptx", "ppt", "key"].includes(ext)) return "presentation";
    if (["doc", "docx", "txt", "odt"].includes(ext)) return "document";
    if (["mp3", "m4a", "wav", "ogg", "aac", "flac"].includes(ext)) return "audio";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
    return "other";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = detectFileType(file);
    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, ""), type }));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const type = detectFileType(file);
    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, title: prev.title || file.name.replace(/\.[^/.]+$/, ""), type }));
  }

  function canPreview(type: string, url: string): boolean {
    return (type === "pdf" || type === "video" || type === "image" || type === "document" || type === "presentation" || (type === "link" && !!url));
  }

  function getPreviewSrc(type: string, url: string): string {
    if (type === "pdf" || type === "document" || type === "presentation") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  }

  function handlePreview(material: { type: string; url: string; title: string }) {
    setPreviewUrl(material.url); setPreviewType(material.type); setPreviewTitle(material.title);
  }

  async function handleSubmit() {
    if (!formData.title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!formData.subjectId) { toast.error("Selecione uma disciplina para o material"); return; }
    const subjectIdNum = formData.subjectId ? parseInt(formData.subjectId) : undefined;
    const folderIdNum = formData.folderId && formData.folderId !== "none" ? parseInt(formData.folderId) : undefined;

    if (formData.type === "link") {
      if (!formData.url.trim()) { toast.error("URL é obrigatória para links"); return; }
      createMaterial.mutate({
        topicId: formData.topicId || 1, title: formData.title, description: formData.description || undefined,
        type: formData.type, url: formData.url, isRequired: formData.isRequired,
        subjectId: subjectIdNum || null, folderId: folderIdNum || null,
      });
      return;
    }

    if (!selectedFile) { toast.error("Selecione um arquivo para upload"); return; }
    setUploading(true); setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);
      const uploadedUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100)); };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) { const data = JSON.parse(xhr.responseText); resolve(data.url); }
          else { try { const ed = JSON.parse(xhr.responseText); reject(new Error(ed.message || `Erro (${xhr.status})`)); } catch { reject(new Error(`Erro (${xhr.status})`)); } }
        };
        xhr.onerror = () => reject(new Error("Erro de rede"));
        xhr.open("POST", "/api/upload-material"); xhr.send(formDataUpload);
      });
      createMaterial.mutate({
        topicId: formData.topicId || 1, title: formData.title, description: formData.description || undefined,
        type: formData.type, url: uploadedUrl, fileSize: selectedFile.size, isRequired: formData.isRequired,
        subjectId: subjectIdNum || null, folderId: folderIdNum || null,
      });
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  // Available folders for the add material dialog (filtered by selected subject)
  const availableFoldersForForm = useMemo(() => {
    if (!formData.subjectId) return [];
    const subjectId = parseInt(formData.subjectId);
    return (folders as FolderItem[]).filter((f) => !f.subjectId || f.subjectId === subjectId);
  }, [formData.subjectId, folders]);

  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-6 px-4">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground"
            onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
          </Button>

          <Breadcrumb items={[
            { label: "Início", href: "/" },
            { label: "Conteúdo" },
            { label: "Materiais de Estudo" },
          ]} />

          {/* Header */}
          <div className="flex items-center justify-between mt-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-primary" />
                Materiais de Estudo
              </h1>
              <p className="text-muted-foreground mt-1">
                Materiais organizados por disciplina e pastas
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
                <FolderPlus className="mr-2 h-4 w-4" /> Nova Pasta
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Material
              </Button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-l-4 border-l-teal-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Total de Materiais</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalMaterials}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Folder className="h-4 w-4" />
                  <span className="text-sm font-medium">Pastas</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalFolders}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Obrigatórios</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{requiredCount}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Downloads</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalDownloads}</p>
              </CardContent>
            </Card>
            {noSubjectCount > 0 && (
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Tag className="h-4 w-4" />
                    <span className="text-sm font-medium">Sem Disciplina</span>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{noSubjectCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Precisam ser associados</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Barra de Armazenamento */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    <span className="text-primary">{usedMB.toFixed(1)} MB</span> de <strong>{(limitMB / 1024).toFixed(0)} GB</strong> ({fileCount} arquivos)
                  </span>
                </div>
                <Badge variant={usagePercent > 80 ? "destructive" : "secondary"}>
                  {usagePercent.toFixed(1)}%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${usagePercent > 80 ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${usagePercent}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-[240px]"><SelectValue placeholder="Todas as disciplinas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as disciplinas</SelectItem>
                    <SelectItem value="none">Sem disciplina</SelectItem>
                    {(subjectsWithClass as any[]).map((s: any) => (
                      <SelectItem key={s.filterKey} value={String(s.id)}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Buscar por título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Materiais Agrupados por Disciplina > Pastas */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : groupedBySubject.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhum material encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || filterType !== "all" || filterSubject !== "all"
                      ? "Tente ajustar os filtros de busca" : "Adicione materiais de estudo para seus alunos"}
                  </p>
                  {!searchTerm && filterType === "all" && filterSubject === "all" && (
                    <Button onClick={() => setShowAddDialog(true)}><Plus className="mr-2 h-4 w-4" />Adicionar Primeiro Material</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groupedBySubject.map((group) => {
                const subjectKey = group.subjectId ? String(group.subjectId) : "none";
                const isSubjectCollapsed = collapsedSubjects.has(subjectKey);

                return (
                  <Card key={subjectKey} className="overflow-hidden">
                    {/* Header da Disciplina */}
                    <div
                      className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      style={{ borderLeft: `4px solid ${group.color}` }}
                      onClick={() => toggleSubjectCollapse(subjectKey)}
                    >
                      <div className="flex items-center gap-3">
                        {isSubjectCollapsed ? (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Folder className="h-6 w-6" style={{ color: group.color }} />
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{group.subjectName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {group.totalCount} material(is)
                            {group.folders.length > 0 && ` · ${group.folders.length} pasta(s)`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {group.totalCount}
                      </Badge>
                    </div>

                    {/* Conteúdo da Disciplina */}
                    {!isSubjectCollapsed && (
                      <div className="border-t">
                        {/* Pastas dentro da disciplina */}
                        {group.folders.map(({ folder, materials: folderMaterials }) => {
                          const folderKey = `folder-${folder.id}`;
                          const isFolderCollapsed = collapsedFolders.has(folderKey);

                          return (
                            <div key={folderKey} className="border-b last:border-b-0">
                              {/* Header da Pasta */}
                              <div
                                className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-muted/20 transition-colors bg-muted/10"
                                onClick={() => toggleFolderCollapse(folderKey)}
                              >
                                <div className="flex items-center gap-3">
                                  {isFolderCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <FolderOpen className="h-5 w-5" style={{ color: folder.color }} />
                                  <div>
                                    <span className="font-medium text-foreground">{folder.name}</span>
                                    {folder.description && (
                                      <p className="text-xs text-muted-foreground">{folder.description}</p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {folderMaterials.length} arquivo(s)
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Excluir a pasta "${folder.name}"? Os materiais serão mantidos sem pasta.`)) {
                                        deleteFolder.mutate({ id: folder.id });
                                      }
                                    }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Materiais dentro da pasta */}
                              {!isFolderCollapsed && (
                                <div className="divide-y pl-4">
                                  {folderMaterials.length === 0 ? (
                                    <div className="py-4 px-6 text-sm text-muted-foreground italic">
                                      Pasta vazia — use o botão de mover para adicionar materiais
                                    </div>
                                  ) : (
                                    folderMaterials.map((material) => (
                                      <MaterialRow
                                        key={material.id}
                                        material={material}
                                        onPreview={handlePreview}
                                        onDelete={(id) => deleteMaterial.mutate({ id })}
                                        onAssignSubject={(id) => setShowAssignSubjectDialog(id)}
                                        onMoveToFolder={(id) => setShowMoveDialog(id)}
                                        canPreviewFn={canPreview}
                                      />
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Materiais soltos (sem pasta) */}
                        {group.looseMaterials.length > 0 && (
                          <div className="divide-y">
                            {group.folders.length > 0 && (
                              <div className="px-6 py-2 bg-muted/5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Sem pasta
                              </div>
                            )}
                            {group.looseMaterials.map((material) => (
                              <MaterialRow
                                key={material.id}
                                material={material}
                                onPreview={handlePreview}
                                onDelete={(id) => deleteMaterial.mutate({ id })}
                                onAssignSubject={(id) => setShowAssignSubjectDialog(id)}
                                onMoveToFolder={(id) => setShowMoveDialog(id)}
                                canPreviewFn={canPreview}
                              />
                            ))}
                          </div>
                        )}

                        {/* Caso só tenha pastas vazias e nenhum material solto */}
                        {group.looseMaterials.length === 0 && group.folders.every(f => f.materials.length === 0) && (
                          <div className="py-4 px-6 text-sm text-muted-foreground text-center italic">
                            Nenhum material nesta disciplina
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>

      {/* Dialog Pré-visualização */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="w-full" style={{ minHeight: "500px" }}>
            {(previewType === "pdf" || previewType === "document" || previewType === "presentation") && previewUrl && (
              <iframe
                src={getPreviewSrc(previewType, previewUrl)}
                className="w-full rounded-lg border"
                style={{ height: "70vh" }}
                title={previewTitle}
                allow="fullscreen"
              />
            )}
            {previewType === "video" && previewUrl && (
              <video src={previewUrl} controls className="w-full rounded-lg" style={{ maxHeight: "70vh" }}>Seu navegador não suporta reprodução de vídeo.</video>
            )}
            {previewType === "image" && previewUrl && (
              <img src={previewUrl} alt={previewTitle} className="w-full rounded-lg object-contain" style={{ maxHeight: "70vh" }} />
            )}
            {previewType === "link" && previewUrl && (
              <iframe src={previewUrl} className="w-full rounded-lg border" style={{ height: "70vh" }} title={previewTitle} sandbox="allow-scripts allow-same-origin allow-popups" />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewUrl(null)}><X className="mr-2 h-4 w-4" />Fechar</Button>
            {previewUrl && (<Button onClick={() => window.open(previewUrl, "_blank")}><Download className="mr-2 h-4 w-4" />Abrir em Nova Aba</Button>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Associar Disciplina */}
      <Dialog open={showAssignSubjectDialog !== null} onOpenChange={() => setShowAssignSubjectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Associar Disciplina</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione a disciplina para este material:</p>
          <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
            {(subjectsWithClass as any[]).map((s: any) => (
              <Button key={s.filterKey} variant="outline" className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  if (showAssignSubjectDialog) {
                    updateSubject.mutate({ materialId: showAssignSubjectDialog, subjectId: s.id });
                  }
                }}>
                <Folder className="mr-3 h-5 w-5 text-primary flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Mover para Pasta */}
      <Dialog open={showMoveDialog !== null} onOpenChange={() => setShowMoveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MoveRight className="h-5 w-5 text-primary" />Mover para Pasta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione a pasta de destino:</p>
          <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
            <Button variant="outline" className="w-full justify-start text-left h-auto py-3"
              onClick={() => {
                if (showMoveDialog) moveToFolder.mutate({ materialId: showMoveDialog, folderId: null });
              }}>
              <FolderOpen className="mr-3 h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Remover da pasta (sem pasta)</span>
            </Button>
            {(folders as FolderItem[]).map((folder) => (
              <Button key={folder.id} variant="outline" className="w-full justify-start text-left h-auto py-3"
                onClick={() => {
                  if (showMoveDialog) moveToFolder.mutate({ materialId: showMoveDialog, folderId: folder.id });
                }}>
                <Folder className="mr-3 h-5 w-5 flex-shrink-0" style={{ color: folder.color }} />
                <div>
                  <span className="truncate font-medium">{folder.name}</span>
                  {folder.description && <p className="text-xs text-muted-foreground">{folder.description}</p>}
                </div>
              </Button>
            ))}
          </div>
          {(folders as FolderItem[]).length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">Nenhuma pasta criada ainda</p>
              <Button variant="outline" size="sm" onClick={() => { setShowMoveDialog(null); setShowFolderDialog(true); }}>
                <FolderPlus className="mr-2 h-4 w-4" /> Criar Pasta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Pasta */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FolderPlus className="h-5 w-5 text-primary" />Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome da Pasta <span className="text-red-500">*</span></Label>
              <Input placeholder="Ex: Aula 01, Provas, Exercícios..." value={folderForm.name} onChange={(e) => setFolderForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>Disciplina (opcional)</Label>
              <Select value={folderForm.subjectId} onValueChange={(val) => setFolderForm((p) => ({ ...p, subjectId: val }))}>
                <SelectTrigger><SelectValue placeholder="Sem disciplina específica" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem disciplina específica</SelectItem>
                  {(subjectsWithClass as any[]).map((s: any) => (
                    <SelectItem key={s.filterKey} value={String(s.id)}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">A pasta aparecerá dentro da disciplina selecionada</p>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea placeholder="Breve descrição da pasta..." value={folderForm.description} onChange={(e) => setFolderForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Cor da Pasta</Label>
              <div className="flex gap-2 mt-2">
                {["#0d9488", "#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#64748b"].map((color) => (
                  <button key={color} className={`w-8 h-8 rounded-full border-2 transition-all ${folderForm.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color }} onClick={() => setFolderForm((p) => ({ ...p, color }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowFolderDialog(false); setFolderForm({ name: "", description: "", color: "#0d9488", subjectId: "" }); }}>Cancelar</Button>
            <Button onClick={() => {
              if (!folderForm.name.trim()) { toast.error("Nome da pasta é obrigatório"); return; }
              const subjectIdNum = folderForm.subjectId && folderForm.subjectId !== "none" ? parseInt(folderForm.subjectId) : null;
              createFolder.mutate({ name: folderForm.name, description: folderForm.description || undefined, color: folderForm.color, subjectId: subjectIdNum });
            }} disabled={createFolder.isPending}>
              {createFolder.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>) : (<><FolderPlus className="mr-2 h-4 w-4" />Criar Pasta</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Material */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Adicionar Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Disciplina <span className="text-red-500">*</span></Label>
              <Select value={formData.subjectId} onValueChange={(val) => setFormData((p) => ({ ...p, subjectId: val, folderId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                <SelectContent>{(subjectsWithClass as any[]).map((s: any) => (<SelectItem key={s.filterKey} value={String(s.id)}>{s.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {availableFoldersForForm.length > 0 && (
              <div>
                <Label>Pasta (opcional)</Label>
                <Select value={formData.folderId} onValueChange={(val) => setFormData((p) => ({ ...p, folderId: val }))}>
                  <SelectTrigger><SelectValue placeholder="Sem pasta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem pasta</SelectItem>
                    {availableFoldersForForm.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Tipo de Material</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData((p) => ({ ...p, type: val as typeof formData.type }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                  <SelectItem value="presentation">Apresentação</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === "link" ? (
              <div><Label>URL do Link</Label><Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))} /></div>
            ) : (
              <div>
                <Label>Arquivo</Label>
                {/* Drag & Drop Zone */}
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : selectedFile
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      {getFileIcon(formData.type)}
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      <button
                        type="button"
                        className="text-xs text-destructive hover:underline mt-1"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      >
                        Remover arquivo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CloudUpload className="h-8 w-8" />
                      <p className="text-sm font-medium">
                        {isDragOver ? "Solte o arquivo aqui" : "Arraste e solte ou clique para selecionar"}
                      </p>
                      <p className="text-xs">
                        {formData.type === "audio"
                          ? "MP3, M4A, WAV, OGG, AAC, FLAC"
                          : formData.type === "image"
                          ? "JPG, PNG, GIF, WEBP, SVG"
                          : formData.type === "video"
                          ? "MP4, WEBM, AVI, MOV, MKV"
                          : formData.type === "pdf"
                          ? "PDF"
                          : formData.type === "presentation"
                          ? "PPTX, PPT, KEY"
                          : formData.type === "document"
                          ? "DOC, DOCX, TXT, ODT"
                          : "Todos os formatos suportados"}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={
                    formData.type === "audio"
                      ? ".mp3,.m4a,.wav,.ogg,.aac,.flac"
                      : formData.type === "image"
                      ? ".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp"
                      : formData.type === "video"
                      ? ".mp4,.webm,.avi,.mov,.mkv"
                      : formData.type === "pdf"
                      ? ".pdf"
                      : formData.type === "presentation"
                      ? ".pptx,.ppt,.key"
                      : formData.type === "document"
                      ? ".doc,.docx,.txt,.odt"
                      : ".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.avi,.mov,.txt,.odt,.key,.mkv,.m4a,.mp3,.jpg,.jpeg,.png,.gif,.webp,.svg,.wav,.ogg,.aac,.flac"
                  }
                  onChange={handleFileSelect}
                />
              </div>
            )}
            <div><Label>Título</Label><Input placeholder="Nome do material" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>Descrição (opcional)</Label><Textarea placeholder="Breve descrição..." value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className="flex items-center justify-between">
              <Label>Material Obrigatório</Label>
              <Switch checked={formData.isRequired} onCheckedChange={(checked) => setFormData((p) => ({ ...p, isRequired: checked }))} />
            </div>
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Enviando...</span><span>{uploadProgress}%</span></div>
                <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={uploading || createMaterial.isPending}>
              {uploading || createMaterial.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>) : (<><Upload className="mr-2 h-4 w-4" />Adicionar Material</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
