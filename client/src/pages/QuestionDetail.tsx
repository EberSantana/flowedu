import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, User, BookOpen, Clock, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function QuestionDetail() {
  const [, params] = useRoute('/questions/:id');
  const questionId = params?.id ? parseInt(params.id) : 0;
  const [answerContent, setAnswerContent] = useState('');

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.questions.getById.useQuery({ id: questionId });
  const answerMutation = trpc.questions.answer.useMutation({
    onSuccess: () => {
      toast.success('Resposta enviada!', {
        description: 'Sua resposta foi enviada com sucesso.',
      });
      setAnswerContent('');
      utils.questions.getById.invalidate({ id: questionId });
      utils.questions.list.invalidate();
    },
    onError: (error) => {
      toast.error('Erro ao enviar resposta', {
        description: error.message,
      });
    },
  });

  const markResolvedMutation = trpc.questions.markResolved.useMutation({
    onSuccess: () => {
      toast.success('Dúvida resolvida!', {
        description: 'A dúvida foi marcada como resolvida.',
      });
      utils.questions.getById.invalidate({ id: questionId });
      utils.questions.list.invalidate();
    },
  });

  const handleSubmitAnswer = () => {
    if (!answerContent.trim()) {
      toast.error('Erro', {
        description: 'Por favor, escreva uma resposta antes de enviar.',
      });
      return;
    }

    answerMutation.mutate({
      questionId,
      content: answerContent,
    });
  };

  const handleMarkResolved = () => {
    markResolvedMutation.mutate({ id: questionId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.question) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Dúvida não encontrada.</p>
            <Link href="/questions">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { question, student, subject } = data.question;
  const answers = data.answers || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "destructive", label: "Pendente" },
      answered: { variant: "default", label: "Respondida" },
      resolved: { variant: "secondary", label: "Resolvida" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/questions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </Link>
      </div>

      {/* Dúvida Principal */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex gap-2">
              {getStatusBadge(question.status)}
              {getPriorityBadge(question.priority)}
            </div>
            {question.status !== 'resolved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkResolved}
                disabled={markResolvedMutation.isPending}
              >
                {markResolvedMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Marcar como Resolvida
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl mb-4">{question.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {question.isAnonymous ? 'Aluno Anônimo' : student?.fullName || 'Aluno'}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {subject?.name || 'Disciplina'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(question.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            <Badge variant="outline" className="text-xs">
              {question.viewCount} visualizações
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{question.content}</p>
          </div>
        </CardContent>
      </Card>

      {/* Respostas */}
      {answers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Respostas ({answers.length})
          </h2>
          <div className="space-y-4">
            {answers.map((item) => (
              <Card key={item.answer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.teacher?.name || 'Professor'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.answer.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {item.answer.isAccepted && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Resposta Aceita
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{item.answer.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de Resposta */}
      {question.status !== 'resolved' && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Resposta</CardTitle>
            <CardDescription>
              Escreva uma resposta clara e detalhada para ajudar o aluno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={answerMutation.isPending || !answerContent.trim()}
                >
                  {answerMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Resposta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
