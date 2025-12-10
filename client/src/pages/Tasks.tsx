import { useState } from "react";
import { trpc } from "../lib/trpc";
import Sidebar from "../components/Sidebar";
import PageWrapper from "../components/PageWrapper";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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
} from "../components/ui/dialog";

import {
  Plus,
  Search,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  Filter,
  X,
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gerenciamento de Tarefas
            </h1>
            <p className="text-sm text-gray-600">
              Organize suas atividades e acompanhe seu progresso
            </p>
          </div>

          {/* Barra de Ações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Botão Criar */}
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
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Título *
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Preparar aula de matemática"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Descrição
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detalhes adicionais sobre a tarefa..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Prioridade
                        </label>
                        <Select
                          value={priority}
                          onValueChange={(value) => setPriority(value as Priority)}
                        >
                          <SelectTrigger>
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Categoria
                        </label>
                        <Input
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Prazo
                        </label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
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

              <div className="ml-auto flex gap-2">
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
            </div>
          </div>

          {/* Lista de Tarefas */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-600">Carregando tarefas...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  Nenhuma tarefa encontrada
                </h3>
                <p className="text-sm text-gray-600">
                  {searchQuery || selectedPriority !== "all" || selectedCategory !== "all"
                    ? "Tente ajustar os filtros ou criar uma nova tarefa"
                    : "Comece criando sua primeira tarefa"}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 p-4 transition-all duration-200 hover:shadow-md ${
                    task.completed
                      ? "border-gray-300 opacity-60"
                      : getPriorityColor(task.priority).split(" ")[2].replace("border-", "border-l-")
                  }`}
                >
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
                </div>
              ))
            )}
          </div>

          {/* Contador */}
          {filteredTasks.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              {filteredTasks.filter((t) => !t.completed).length} pendente(s) de{" "}
              {filteredTasks.length} tarefa(s)
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
