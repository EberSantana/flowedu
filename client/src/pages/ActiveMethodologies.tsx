import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, ExternalLink, Pencil, Trash2, Search, Star, StarOff, BookOpen } from "lucide-react";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";

const CATEGORIES = [
  "Quiz e Avaliação",
  "Colaboração",
  "Apresentação",
  "Gamificação",
  "Formulários",
  "Quadro Branco",
  "Vídeo e Áudio",
  "Outros"
];

export default function ActiveMethodologies() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMethodology, setEditingMethodology] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    url: "",
    tips: "",
    logoUrl: "",
    isFavorite: false,
  });

  const { data: methodologies = [], refetch } = trpc.activeMethodologies.list.useQuery();
  const createMutation = trpc.activeMethodologies.create.useMutation();
  const updateMutation = trpc.activeMethodologies.update.useMutation();
  const deleteMutation = trpc.activeMethodologies.delete.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Metodologia criada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error("Erro ao criar metodologia: " + error.message);
    }
  };

  const handleEdit = async () => {
    if (!editingMethodology) return;
    try {
      await updateMutation.mutateAsync({ id: editingMethodology.id, ...formData });
      toast.success("Metodologia atualizada com sucesso!");
      setIsEditOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error("Erro ao atualizar metodologia: " + error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta metodologia?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Metodologia excluída com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao excluir metodologia: " + error.message);
    }
  };

  const toggleFavorite = async (methodology: any) => {
    try {
      await updateMutation.mutateAsync({ 
        id: methodology.id, 
        isFavorite: !methodology.isFavorite 
      });
      refetch();
    } catch (error: any) {
      toast.error("Erro ao atualizar favorito: " + error.message);
    }
  };

  const openEditDialog = (methodology: any) => {
    setEditingMethodology(methodology);
    setFormData({
      name: methodology.name,
      description: methodology.description,
      category: methodology.category,
      url: methodology.url,
      tips: methodology.tips || "",
      logoUrl: methodology.logoUrl || "",
      isFavorite: methodology.isFavorite,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      url: "",
      tips: "",
      logoUrl: "",
      isFavorite: false,
    });
    setEditingMethodology(null);
  };

  const filteredMethodologies = methodologies.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Quiz e Avaliação": "from-primary to-primary/80",
      "Colaboração": "from-success to-success/80",
      "Apresentação": "from-accent to-accent/80",
      "Gamificação": "from-warning to-warning/80",
      "Formulários": "from-pink-500 to-pink-600",
      "Quadro Branco": "from-teal-500 to-teal-600",
      "Vídeo e Áudio": "from-red-500 to-red-600",
      "Outros": "from-gray-500 to-gray-600",
    };
    return colors[category] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <PageWrapper className="flex-1">
        <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Metodologias Ativas
          </h1>
          <p className="text-muted-foreground mt-1">
            Biblioteca de ferramentas pedagógicas para suas aulas
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ferramenta
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ferramentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid de Metodologias */}
      {filteredMethodologies.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma ferramenta encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== "all" 
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando sua primeira ferramenta pedagógica"}
          </p>
          {!searchTerm && selectedCategory === "all" && (
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Ferramenta
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethodologies.map((methodology) => (
            <Card key={methodology.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getCategoryColor(methodology.category)}`} />
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                      {methodology.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{methodology.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(methodology)}
                    className="shrink-0"
                  >
                    {methodology.isFavorite ? (
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {methodology.description}
                </p>

                {/* Tips */}
                {methodology.tips && (
                  <div className="bg-info/10 p-3 rounded-lg">
                    <p className="text-xs text-info">
                      💡 {methodology.tips}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    onClick={() => window.open(methodology.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(methodology)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(methodology.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
        </div>
      </PageWrapper>

      {/* Dialog de Criação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Ferramenta Pedagógica</DialogTitle>
            <DialogDescription>
              Adicione uma nova metodologia ativa à sua biblioteca
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Ferramenta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Kahoot, Mentimeter, Padlet..."
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que é e para que serve esta ferramenta..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="url">Link de Acesso *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="tips">Dicas de Uso Pedagógico</Label>
              <Textarea
                id="tips"
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                placeholder="Compartilhe dicas de como usar esta ferramenta em sala de aula..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="logoUrl">URL do Logo (opcional)</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.description || !formData.category || !formData.url}>
              Criar Ferramenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ferramenta</DialogTitle>
            <DialogDescription>
              Atualize as informações da ferramenta pedagógica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Ferramenta *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-url">Link de Acesso *</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-tips">Dicas de Uso Pedagógico</Label>
              <Textarea
                id="edit-tips"
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
