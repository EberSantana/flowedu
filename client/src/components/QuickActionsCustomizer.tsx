import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { GripVertical, RotateCcw } from "lucide-react";
import * as Icons from "lucide-react";

export interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Icons;
  href: string;
  color: string;
  enabled: boolean;
  order?: number;
  category?: string;
}

// Todas as ações disponíveis organizadas por categoria
export const ALL_AVAILABLE_ACTIONS: (QuickAction & { category: string })[] = [
  // Gestão Acadêmica
  { id: 'subjects', label: 'Disciplinas', icon: 'BookOpen', href: '/subjects', color: 'from-primary to-primary/80', enabled: false, order: 11, category: 'Gestão Acadêmica' },
  { id: 'classes', label: 'Turmas', icon: 'Users', href: '/classes', color: 'from-primary to-primary/80', enabled: false, order: 12, category: 'Gestão Acadêmica' },
  { id: 'students', label: 'Alunos', icon: 'GraduationCap', href: '/students', color: 'from-primary to-primary/80', enabled: false, order: 13, category: 'Gestão Acadêmica' },
  { id: 'enrollments', label: 'Matrículas', icon: 'UserPlus', href: '/subjects', color: 'from-primary to-primary/80', enabled: false, order: 14, category: 'Gestão Acadêmica' },

  // Planejamento
  { id: 'schedule', label: 'Grade Semanal', icon: 'Calendar', href: '/schedule', color: 'from-primary to-primary/80', enabled: true, order: 4, category: 'Planejamento' },
  { id: 'calendar', label: 'Calendário', icon: 'CalendarDays', href: '/calendar', color: 'from-primary to-primary/80', enabled: false, order: 15, category: 'Planejamento' },
  { id: 'tasks', label: 'Tarefas', icon: 'CheckSquare', href: '/tasks', color: 'from-primary to-primary/80', enabled: false, order: 16, category: 'Planejamento' },
  { id: 'shifts', label: 'Turnos', icon: 'Clock', href: '/shifts', color: 'from-primary to-primary/80', enabled: false, order: 17, category: 'Planejamento' },

  // Conteúdo
  { id: 'trails', label: 'Trilhas de Aprendizagem', icon: 'Map', href: '/learning-paths', color: 'from-primary to-primary/80', enabled: false, order: 18, category: 'Conteúdo' },
  { id: 'exercises', label: 'Exercícios', icon: 'PenLine', href: '/questions', color: 'from-primary to-primary/80', enabled: false, order: 19, category: 'Conteúdo' },
  { id: 'exams', label: 'Banco de Provas', icon: 'FileText', href: '/assessments-manager', color: 'from-primary to-primary/80', enabled: true, order: 6, category: 'Conteúdo' },
  { id: 'methodologies', label: 'Metodologias Ativas', icon: 'Lightbulb', href: '/active-methodologies', color: 'from-primary to-primary/80', enabled: false, order: 20, category: 'Conteúdo' },
  { id: 'activities', label: 'Atividades em Sala', icon: 'ClipboardList', href: '/activities', color: 'from-primary to-primary/80', enabled: true, order: 1, category: 'Conteúdo' },

  // Comunicação
  { id: 'announcements', label: 'Avisos', icon: 'Bell', href: '/announcements', color: 'from-primary to-primary/80', enabled: true, order: 3, category: 'Comunicação' },
  { id: 'doubts', label: 'Dúvidas dos Alunos', icon: 'MessageCircleQuestion', href: '/teacher-doubts', color: 'from-primary to-primary/80', enabled: true, order: 5, category: 'Comunicação' },
  { id: 'email', label: 'Enviar E-mail', icon: 'Mail', href: '/admin/email-send', color: 'from-primary to-primary/80', enabled: false, order: 21, category: 'Comunicação' },

  // Relatórios
  { id: 'grades', label: 'Boletim / Notas', icon: 'BarChart2', href: '/teacher-grades', color: 'from-primary to-primary/80', enabled: true, order: 2, category: 'Relatórios' },
  { id: 'analytics', label: 'IA Pedagógica', icon: 'Brain', href: '/learning-analytics', color: 'from-primary to-primary/80', enabled: false, order: 22, category: 'Relatórios' },
  { id: 'exercise_report', label: 'Relatório de Exercícios', icon: 'BarChart3', href: '/exercise-dashboard', color: 'from-primary to-primary/80', enabled: false, order: 23, category: 'Relatórios' },
  { id: 'learning_report', label: 'Relatório de Trilhas', icon: 'TrendingUp', href: '/learning-path-report', color: 'from-primary to-primary/80', enabled: false, order: 24, category: 'Relatórios' },
  { id: 'access_logs', label: 'Log de Acessos', icon: 'Activity', href: '/access-logs', color: 'from-primary to-primary/80', enabled: false, order: 25, category: 'Relatórios' },

  // Administração
  { id: 'users', label: 'Usuários', icon: 'UserCog', href: '/admin/users', color: 'from-primary to-primary/80', enabled: false, order: 26, category: 'Administração' },
  { id: 'settings', label: 'Configurações', icon: 'Settings', href: '/admin/settings', color: 'from-primary to-primary/80', enabled: false, order: 27, category: 'Administração' },
  { id: 'backups', label: 'Backups', icon: 'HardDrive', href: '/admin/backups', color: 'from-primary to-primary/80', enabled: false, order: 28, category: 'Administração' },
  { id: 'vps', label: 'Monitoramento VPS', icon: 'Server', href: '/admin/vps-monitoring', color: 'from-primary to-primary/80', enabled: false, order: 29, category: 'Administração' },
];

// Ações padrão (habilitadas por padrão)
const DEFAULT_ACTIONS: QuickAction[] = ALL_AVAILABLE_ACTIONS.map(a => ({
  id: a.id,
  label: a.label,
  icon: a.icon,
  href: a.href,
  color: a.color,
  enabled: a.enabled,
  order: a.order,
}));

interface QuickActionsCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (actions: QuickAction[]) => void;
}

const CATEGORY_ORDER = ['Gestão Acadêmica', 'Planejamento', 'Conteúdo', 'Comunicação', 'Relatórios', 'Administração'];

export function QuickActionsCustomizer({ open, onOpenChange, onSave }: QuickActionsCustomizerProps) {
  const [actions, setActions] = useState<QuickAction[]>(DEFAULT_ACTIONS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'enabled' | 'all'>('all');

  const { data: preferences } = trpc.dashboard.getQuickActionsPreferences.useQuery(undefined, {
    enabled: open,
  });

  const utils = trpc.useUtils();

  const saveMutation = trpc.dashboard.saveQuickActionsPreferences.useMutation({
    onSuccess: async () => {
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
      // Mesclar preferências salvas com novas ações disponíveis
      const savedIds = new Set(preferences.actions.map((a: QuickAction) => a.id));
      const newActions = DEFAULT_ACTIONS.filter(a => !savedIds.has(a.id));
      setActions([...preferences.actions, ...newActions]);
    }
  }, [preferences]);

  const handleToggle = (id: string) => {
    setActions(actions.map(action =>
      action.id === id ? { ...action, enabled: !action.enabled } : action
    ));
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);

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

  const handleDragEnd = () => setDraggedIndex(null);

  const handleReset = () => {
    setActions(DEFAULT_ACTIONS);
    toast.info("🔄 Preferências restauradas para o padrão");
  };

  const handleSave = () => {
    if (enabledCount === 0) {
      toast.error("⚠️ Selecione pelo menos uma ação!");
      return;
    }
    saveMutation.mutate({ actions });
  };

  const enabledCount = actions.filter(a => a.enabled).length;

  // Agrupar por categoria para a aba "Todas"
  const actionsByCategory = CATEGORY_ORDER.map(cat => ({
    category: cat,
    items: actions.filter(a => {
      const meta = ALL_AVAILABLE_ACTIONS.find(m => m.id === a.id);
      return meta?.category === cat;
    }),
  })).filter(g => g.items.length > 0);

  // Apenas ativas para a aba "Ativas"
  const enabledActions = actions.filter(a => a.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalizar Ações Rápidas</DialogTitle>
          <DialogDescription>
            Escolha quais ações exibir no dashboard.{" "}
            <span className="font-semibold text-primary">{enabledCount} ações selecionadas</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Abas */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas as opções ({actions.length})
          </button>
          <button
            onClick={() => setActiveTab('enabled')}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'enabled' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ativas ({enabledCount}) — Reordenar
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1">
          {/* Aba: Todas as opções agrupadas por categoria */}
          {activeTab === 'all' && (
            <div className="space-y-5 mt-2">
              {actionsByCategory.map(({ category, items }) => (
                <div key={category}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                    {category}
                  </p>
                  <div className="space-y-1.5">
                    {items.map((action) => {
                      const IconComponent = Icons[action.icon] as React.ComponentType<{ className?: string }>;
                      return (
                        <div
                          key={action.id}
                          onClick={() => handleToggle(action.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            action.enabled
                              ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
                              : 'bg-muted/30 border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            action.enabled ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-muted'
                          }`}>
                            <IconComponent className={`h-4 w-4 ${action.enabled ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${action.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {action.label}
                            </p>
                          </div>
                          <Checkbox
                            checked={action.enabled}
                            onCheckedChange={() => handleToggle(action.id)}
                            className="shrink-0"
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aba: Ativas — arrastar para reordenar */}
          {activeTab === 'enabled' && (
            <div className="space-y-2 mt-2">
              {enabledActions.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhuma ação selecionada. Vá para "Todas as opções" para adicionar.
                </p>
              )}
              {enabledActions.map((action, index) => {
                const globalIndex = actions.findIndex(a => a.id === action.id);
                const IconComponent = Icons[action.icon] as React.ComponentType<{ className?: string }>;
                const meta = ALL_AVAILABLE_ACTIONS.find(m => m.id === action.id);
                return (
                  <div
                    key={action.id}
                    draggable
                    onDragStart={() => handleDragStart(globalIndex)}
                    onDragOver={(e) => handleDragOver(e, globalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-move bg-primary/5 border-primary/30 hover:border-primary hover:shadow-md ${
                      draggedIndex === globalIndex ? 'opacity-30 scale-95' : ''
                    }`}
                  >
                    <GripVertical className="h-5 w-5 text-primary shrink-0" />
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-primary/80">
                      <IconComponent className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{action.label}</p>
                      {meta?.category && (
                        <p className="text-xs text-muted-foreground">{meta.category}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">#{index + 1}</Badge>
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => handleToggle(action.id)}
                      className="shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={handleReset} className="gap-2">
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
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
