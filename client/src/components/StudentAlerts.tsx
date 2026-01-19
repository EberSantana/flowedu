import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, CheckCircle, Clock, X } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

interface Alert {
  id: string;
  type: 'announcement' | 'task';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  isImportant?: boolean;
      dueDate?: string | null;
  link: string;
  createdAt: Date;
}

export function StudentAlerts() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Buscar avisos não lidos
  const { data: announcements } = trpc.announcements.getForStudent.useQuery();
  const { data: unreadCount } = trpc.announcements.getUnreadCount.useQuery();
  
  // Buscar tarefas pendentes (não completadas)
  const { data: tasks } = trpc.tasks.getByFilter.useQuery({ completed: false });
  
  // Converter avisos em alertas
  const announcementAlerts: Alert[] = (announcements || [])
    .filter(a => a.isImportant) // Apenas avisos importantes aparecem como alertas
    .slice(0, 3) // Máximo 3 avisos
    .map(a => ({
      id: `announcement-${a.id}`,
      type: 'announcement' as const,
      title: a.title,
      message: a.message,
      priority: a.isImportant ? 'high' as const : 'medium' as const,
      isImportant: a.isImportant,
      link: '/student-announcements',
      createdAt: new Date(a.createdAt),
    }));
  
  // Converter tarefas em alertas (apenas as próximas do vencimento ou vencidas)
  const now = new Date();
  const taskAlerts: Alert[] = (tasks || [])
    .filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3; // Apenas tarefas com vencimento em até 3 dias ou vencidas
    })
    .slice(0, 3) // Máximo 3 tarefas
    .map(t => {
      const dueDate = new Date(t.dueDate!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = daysUntilDue < 0;
      
      return {
        id: `task-${t.id}`,
        type: 'task' as const,
        title: t.title,
        message: t.description || '',
        priority: isOverdue ? 'high' as const : (t.priority as 'high' | 'medium' | 'low'),
        dueDate: t.dueDate,
        link: '/student-tasks',
        createdAt: new Date(t.createdAt),
      };
    });
  
  // Combinar e ordenar alertas por prioridade e data
  const allAlerts = [...announcementAlerts, ...taskAlerts]
    .filter(alert => !dismissedAlerts.has(alert.id))
    .sort((a, b) => {
      // Prioridade: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // Depois por data (mais recente primeiro)
      return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 5); // Máximo 5 alertas no total
  
  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
  };
  
  if (allAlerts.length === 0) {
    return null; // Não exibir nada se não houver alertas
  }
  
  return (
    <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
              Alertas Importantes
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Você tem {allAlerts.length} {allAlerts.length === 1 ? 'alerta' : 'alertas'} que {allAlerts.length === 1 ? 'requer' : 'requerem'} atenção
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {allAlerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 mt-0.5">
                {alert.type === 'announcement' ? (
                  <AlertCircle className={`h-5 w-5 ${
                    alert.priority === 'high' 
                      ? 'text-red-500' 
                      : 'text-blue-500'
                  }`} />
                ) : (
                  <Clock className={`h-5 w-5 ${
                    alert.priority === 'high' 
                      ? 'text-red-500' 
                      : alert.priority === 'medium'
                      ? 'text-amber-500'
                      : 'text-blue-500'
                  }`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                    {alert.title}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {alert.message && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {alert.message}
                  </p>
                )}
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={alert.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.type === 'announcement' ? '📢 Aviso' : '📝 Tarefa'}
                  </Badge>
                  
                  {alert.dueDate && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                  
                  <Link href={alert.link}>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Ver detalhes →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
          <div className="flex gap-2">
            <Link href="/student-announcements" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ver todos os avisos
              </Button>
            </Link>
            <Link href="/student-exercises" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Ver todos os exercícios
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
