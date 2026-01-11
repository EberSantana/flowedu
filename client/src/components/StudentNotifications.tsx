import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X, AlertCircle, BookOpen, FileText, MessageSquare, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const notificationIcons: Record<string, React.ReactNode> = {
  new_material: <BookOpen className="h-4 w-4 text-blue-500" />,
  new_assignment: <FileText className="h-4 w-4 text-purple-500" />,
  new_announcement: <AlertCircle className="h-4 w-4 text-orange-500" />,
  assignment_due: <Clock className="h-4 w-4 text-red-500" />,
  feedback_received: <MessageSquare className="h-4 w-4 text-green-500" />,
  grade_received: <Award className="h-4 w-4 text-yellow-500" />,
  comment_received: <MessageSquare className="h-4 w-4 text-cyan-500" />,
};

export function StudentNotifications() {
  const [open, setOpen] = useState(false);
  
  const { data: notifications, refetch: refetchNotifications } = trpc.student.getNotifications.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Atualiza a cada 30 segundos
  );
  
  const { data: unreadCount, refetch: refetchCount } = trpc.student.getUnreadNotificationsCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  
  const markAsReadMutation = trpc.student.markNotificationAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });
  
  const markAllAsReadMutation = trpc.student.markAllNotificationsAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });
  
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notificationIcons[notification.type] || <Bell className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-medium" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default StudentNotifications;
