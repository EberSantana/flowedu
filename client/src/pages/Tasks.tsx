import { useState } from "react";
import { trpc } from "../lib/trpc";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Plus,
  Search,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  CheckSquare,
} from "lucide-react";

type Priority = "low" | "medium" | "high";
type FilterType = "all" | "today" | "week" | "completed" | "pending";

export default function Tasks() {
  const utils = trpc.useUtils();

  // Estados
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Queries
  const { data: tasks = [], isLoading } = trpc.tasks.getAll.useQuery();
  const { data: categories = [] } = trpc.tasks.getCategories.useQuery();

  // Mutations
  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.tasks.getCategories.invalidate();
      alert("Tarefa criada com sucesso!");
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      alert(`Erro ao criar tarefa: ${error.message}`);
    },
  });

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      alert("Tarefa atualizada com sucesso!");
      setEditingTask(null);
      resetForm();
    },
    onError: (error) => {
      alert(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });

  const toggleComplete = trpc.tasks.toggleComplete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.getAll.invalidate();
      utils.tasks.getCategories.invalidate();
      alert("Tarefa deletada com sucesso!");
    },
    onError: (error) => {
      alert(`Erro ao deletar tarefa: ${error.message}`);
    },
  });

  // Funções auxiliares
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("");
    setDueDate("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Por favor, insira um título para a tarefa");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category: category.trim() || undefined,
      dueDate: dueDate || undefined,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...taskData });
    } else {
      createTask.mutate(taskData);
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setCategory(task.category || "");
    setDueDate(task.dueDate || "");
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number, taskTitle: string) => {
    if (confirm(`Tem certeza que deseja deletar a tarefa "${taskTitle}"?`)) {
      deleteTask.mutate({ id });
    }
  };

  const handleToggleComplete = (id: number) => {
    toggleComplete.mutate({ id });
  };

  // Filtros
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filtro por status/período
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (filter) {
      case "completed":
        filtered = filtered.filter((t) => t.completed);
        break;
      case "pending":
        filtered = filtered.filter((t) => !t.completed);
        break;
      case "today":
        filtered = filtered.filter((t) => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        });
        break;
      case "week":
        filtered = filtered.filter((t) => {
          if (!t.dueDate) return false;
          const taskDate = new Date(t.dueDate);
          return taskDate >= today && taskDate <= weekFromNow;
        });
        break;
    }

    // Filtro por prioridade
    if (selectedPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === selectedPriority);
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Cores de prioridade
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  };

  const isOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dateString);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="container mx-auto py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <CheckSquare className="h-8 w-8 text-teal-600" />
                Gerenciar Tarefas
              </h1>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) {
                  setEditingTask(null);
                  resetForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTask ? "Atualize as informações da tarefa" : "Crie uma nova tarefa para organizar suas atividades"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Preparar aula de matemática"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Detalhes adicionais sobre a tarefa..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select
                        value={priority}
                        onValueChange={(value) => setPriority(value as Priority)}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Ex: Aulas, Administrativo"
                        list="categories-list"
                      />
                      <datalist id="categories-list">
                        {categories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Prazo</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingTask(null);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTask.isPending || updateTask.isPending}
                    >
                      {editingTask ? "Salvar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Barra de Filtros e Busca */}
          <Card className="mb-6 bg-white shadow-md">
            <CardContent className="p-4">
              {/* Busca */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros Rápidos */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={filter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("today")}
                >
                  Hoje
                </Button>
                <Button
                  variant={filter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("week")}
                >
                  Esta Semana
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  Pendentes
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("completed")}
                >
                  Concluídas
                </Button>
              </div>

              {/* Filtros Avançados */}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedPriority}
                  onValueChange={(value) =>
                    setSelectedPriority(value as Priority | "all")
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Tarefas */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando tarefas...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="bg-white shadow-lg">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Nenhuma tarefa encontrada
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchQuery || selectedPriority !== "all" || selectedCategory !== "all"
                    ? "Tente ajustar os filtros ou criar uma nova tarefa"
                    : "Comece criando sua primeira tarefa"}
                </p>
                {!searchQuery && selectedPriority === "all" && selectedCategory === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Tarefa
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={`bg-white shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ${
                      task.completed
                        ? "border-l-gray-300 opacity-60"
                        : getPriorityColor(task.priority).split(" ")[2].replace("border-", "border-l-")
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleComplete(task.id)}
                          className="mt-1 flex-shrink-0 transition-transform hover:scale-110"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-base font-medium mb-1 ${
                              task.completed
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 items-center">
                            {/* Prioridade */}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {getPriorityLabel(task.priority)}
                            </span>

                            {/* Categoria */}
                            {task.category && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Tag className="h-3 w-3" />
                                {task.category}
                              </span>
                            )}

                            {/* Data */}
                            {task.dueDate && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                  isOverdue(task.dueDate) && !task.completed
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-gray-50 text-gray-700 border border-gray-200"
                                }`}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                                {isOverdue(task.dueDate) && !task.completed && " (Atrasada)"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(task)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(task.id, task.title)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contador */}
              <div className="mt-6 text-center text-sm text-gray-600">
                {filteredTasks.filter((t) => !t.completed).length} pendente(s) de{" "}
                {filteredTasks.length} tarefa(s)
              </div>
            </>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
