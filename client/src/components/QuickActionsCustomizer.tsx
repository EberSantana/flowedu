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
  color: string; // Cor hexadecimal (ex: #10b981 para verde)
  enabled: boolean;
}

// Cores hexadecimais para consistência visual
// Verde: #10b981, Azul: #3b82f6, Vermelho: #ef4444, Laranja: #f59e0b, Roxo: #8b5cf6
const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'new-subject', label: 'Nova Disciplina', icon: 'Plus', href: '/subjects', color: 'from-primary to-primary/80', enabled: true, order: 1 },
  { id: 'schedule', label: 'Grade Completa', icon: 'Calendar', href: '/schedule', color: 'from-primary to-primary/80', enabled: true, order: 2 },
  { id: 'reports', label: 'Relatórios', icon: 'BarChart3', href: '/reports', color: 'from-primary to-primary/80', enabled: true, order: 3 },
  { id: 'tasks', label: 'Tarefas', icon: 'CheckSquare', href: '/tasks', color: 'from-primary to-primary/80', enabled: true, order: 4 },
  { id: 'announcements', label: 'Avisos', icon: 'Bell', href: '/announcements', color: 'from-primary to-primary/80', enabled: true, order: 5 },
  { id: 'classes', label: 'Turmas', icon: 'Users', href: '/classes', color: 'from-primary to-primary/80', enabled: false, order: 6 },
  { id: 'calendar', label: 'Calendário', icon: 'CalendarDays', href: '/calendar', color: 'from-primary to-primary/80', enabled: false, order: 7 },
  { id: 'methodologies', label: 'Metodologias', icon: 'Lightbulb', href: '/active-methodologies', color: 'from-primary to-primary/80', enabled: false, order: 8 },
  { id: 'learning-paths', label: 'Trilhas', icon: 'Route', href: '/learning-paths', color: 'from-primary to-primary/80', enabled: false, order: 9 },
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

  const utils = trpc.useUtils();
  
  const saveMutation = trpc.dashboard.saveQuickActionsPreferences.useMutation({
    onSuccess: async () => {
      // Invalidar cache para recarregar preferências
      await utils.dashboard.getQuickActionsPreferences.invalidate();
      toast.success("✅ Preferências salvas com sucesso!");
      onSave(actions);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("❌ Erro ao salvar preferências: " + error.message);
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
    toast.info("🔄 Preferências restauradas para o padrão");
  };

  const handleSave = () => {
    // Validar se pelo menos uma ação está habilitada
    if (enabledCount === 0) {
      toast.error("⚠️ Selecione pelo menos uma ação!");
      return;
    }
    
    saveMutation.mutate({ actions });
  };

  const enabledCount = actions.filter(a => a.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Ações Rápidas</DialogTitle>
          <DialogDescription>
            Escolha quais ações exibir no dashboard e arraste para reordenar. <span className="font-semibold text-primary">{enabledCount} ações selecionadas</span>.
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
                    ? 'bg-white border-primary/30 hover:border-primary hover:shadow-md hover:bg-primary/5' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                } ${draggedIndex === index ? 'opacity-30 scale-95 rotate-2' : ''}`}
              >
                <GripVertical className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  action.enabled ? 'text-primary' : 'text-gray-400'
                }`} />
                
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-primary/80">
                  <IconComponent className="h-5 w-5 text-primary-foreground" />
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
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || enabledCount === 0}
            className={enabledCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
