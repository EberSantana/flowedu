import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MessageSquare, Clock, CheckCircle2, AlertCircle, User, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Questions() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'answered' | 'resolved' | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<'low' | 'normal' | 'high' | 'urgent' | undefined>(undefined);
  
  const { data: questions, isLoading } = trpc.questions.list.useQuery({
    status: statusFilter,
    priority: priorityFilter,
  }, {
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });
  
  const { data: stats } = trpc.questions.statistics.useQuery(undefined, {
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });
  const { data: subjects } = trpc.subjects.list.useQuery();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
      pending: { variant: "destructive", icon: Clock, label: "Pendente" },
      answered: { variant: "default", icon: MessageSquare, label: "Respondida" },
      resolved: { variant: "secondary", icon: CheckCircle2, label: "Resolvida" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      low: { variant: "secondary", label: "Baixa" },
      normal: { variant: "default", label: "Normal" },
      high: { variant: "outline", label: "Alta" },
      urgent: { variant: "destructive", label: "Urgente" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dúvidas dos Alunos</h1>
        <p className="text-muted-foreground">
          Gerencie e responda às dúvidas enviadas pelos seus alunos
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Respondidas</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.urgent}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => setStatusFilter(value === 'all' ? undefined : value as any)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="answered">Respondidas</SelectItem>
                  <SelectItem value="resolved">Resolvidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium mb-2 block">Prioridade</label>
              <Select
                value={priorityFilter || 'all'}
                onValueChange={(value) => setPriorityFilter(value === 'all' ? undefined : value as any)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(statusFilter || priorityFilter) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter(undefined);
                    setPriorityFilter(undefined);
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Dúvidas */}
      <div className="space-y-4">
        {questions && questions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma dúvida encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        )}
        
        {questions?.map((item) => (
          <Card key={item.question.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(item.question.status)}
                    {getPriorityBadge(item.question.priority)}
                    {item.question.viewCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {item.question.viewCount} visualizações
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2">{item.question.title}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.question.isAnonymous ? 'Aluno Anônimo' : item.student?.fullName || 'Aluno'}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {item.subject?.name || 'Disciplina'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(item.question.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </CardDescription>
                </div>
                <Link href={`/questions/${item.question.id}`}>
                  <Button>Ver Detalhes</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.question.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
