import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GripVertical, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";

export interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  href: string;
  color: string; // Gradiente de cores (from-X-500 to-X-600)
  enabled: boolean;
}

// Cores baseadas nas variáveis do tema para consistência visual
const DEFAULT_ACTIONS: QuickAction[] = [
  { id: "new-subject", label: "Nova Disciplina", icon: "Plus", href: "/subjects", color: "from-primary to-primary/80", enabled: true },
  { id: "schedule", label: "Grade Completa", icon: "Calendar", href: "/schedule", color: "from-slate-600 to-slate-500", enabled: true },
  { id: "reports", label: "Relatórios", icon: "BarChart3", href: "/reports", color: "from-emerald-600 to-emerald-500", enabled: true },
  { id: "tasks", label: "Tarefas", icon: "CheckSquare", href: "/tasks", color: "from-blue-600 to-blue-500", enabled: true },
  { id: "announcements", label: "Avisos", icon: "Bell", href: "/announcements", color: "from-destructive to-destructive/80", enabled: true },
  { id: "classes", label: "Turmas", icon: "Users", href: "/classes", color: "from-warning to-warning/80", enabled: false },
  { id: "calendar", label: "Calendário", icon: "CalendarDays", href: "/calendar", color: "from-chart-1 to-chart-1/80", enabled: false },
  { id: "methodologies", label: "Metodologias", icon: "Lightbulb", href: "/active-methodologies", color: "from-chart-2 to-chart-2/80", enabled: false },
  { id: "learning-paths", label: "Trilhas", icon: "TrendingUp", href: "/learning-paths", color: "from-chart-3 to-chart-3/80", enabled: false },
];

interface QuickActionsCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (actions: QuickAction[]) => void;
}

export function QuickActionsCustomizer({ open, onOpenChange, onSave }: QuickActionsCustomizerProps) {
  const [actions, setActions] = useState<QuickAction[]>(DEFAULT_ACTIONS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: preferences } = trpc.dashboard.getQuickActionsPreferences.useQuery(undefined, {
    enabled: open,
  });

  const saveMutation = trpc.dashboard.saveQuickActionsPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferências salvas com sucesso!");
      onSave(actions);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar preferências: " + error.message);
    },
  });

  useEffect(() => {
    if (preferences?.actions) {
      setActions(preferences.actions);
    }
  }, [preferences]);

  const handleToggle = (id: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, enabled: !action.enabled } : action
    ));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newActions = [...actions];
    const draggedItem = newActions[draggedIndex];
    newActions.splice(draggedIndex, 1);
    newActions.splice(index, 0, draggedItem);
    
    setActions(newActions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    setActions(DEFAULT_ACTIONS);
    toast.info("Preferências restauradas para o padrão");
  };

  const handleSave = () => {
    saveMutation.mutate({ actions });
  };

  const enabledCount = actions.filter(a => a.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Ações Rápidas</DialogTitle>
          <DialogDescription>
            Escolha quais ações exibir no dashboard e arraste para reordenar. {enabledCount} ações selecionadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {actions.map((action, index) => {
            const IconComponent = Icons[action.icon] as React.ComponentType<{ className?: string }>;
            
            return (
              <div
                key={action.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-move ${
                  action.enabled 
                    ? 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              >
                <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{action.label}</p>
                  <p className="text-xs text-gray-500">{action.href}</p>
                </div>

                <Checkbox
                  checked={action.enabled}
                  onCheckedChange={() => handleToggle(action.id)}
                  className="flex-shrink-0"
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
