import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Send, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentSubmitQuestion() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    isAnonymous: false,
  });

  const { data: subjects, isLoading: loadingSubjects } = trpc.subjects.list.useQuery();
  
  const submitMutation = trpc.questions.submit.useMutation({
    onSuccess: () => {
      toast.success('Dúvida enviada!', {
        description: 'Sua dúvida foi enviada com sucesso. O professor receberá uma notificação.',
      });
      setLocation('/student/my-questions');
    },
    onError: (error) => {
      toast.error('Erro ao enviar dúvida', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Campos obrigatórios', {
        description: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    submitMutation.mutate({
      subjectId: parseInt(formData.subjectId),
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      isAnonymous: formData.isAnonymous,
    });
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Enviar Dúvida
        </h1>
        <p className="text-muted-foreground">
          Envie sua dúvida para o professor. Você receberá uma resposta em breve!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Dúvida</CardTitle>
          <CardDescription>
            Preencha os campos abaixo com sua dúvida. Seja específico para receber uma resposta mais precisa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Disciplina */}
            <div className="space-y-2">
              <Label htmlFor="subject">Disciplina *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Selecione a disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {loadingSubjects ? (
                    <div className="p-2 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Dúvida *</Label>
              <Input
                id="title"
                placeholder="Ex: Dúvida sobre equações de segundo grau"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground">
                Seja breve e específico no título
              </p>
            </div>

            {/* Conteúdo */}
            <div className="space-y-2">
              <Label htmlFor="content">Descrição da Dúvida *</Label>
              <Textarea
                id="content"
                placeholder="Descreva sua dúvida com detalhes. Quanto mais informações você fornecer, melhor será a resposta do professor."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 10 caracteres
              </p>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa - Posso esperar alguns dias</SelectItem>
                  <SelectItem value="normal">Normal - Resposta em 1-2 dias</SelectItem>
                  <SelectItem value="high">Alta - Preciso de resposta logo</SelectItem>
                  <SelectItem value="urgent">Urgente - Preciso de resposta hoje</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Anônimo */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isAnonymous: checked as boolean })
                }
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                Enviar dúvida de forma anônima
              </Label>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/student/my-questions')}
                disabled={submitMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex-1"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Dúvida
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">💡 Dicas para uma boa dúvida</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>• Seja específico sobre o que você não entendeu</p>
          <p>• Mencione o que você já tentou fazer para resolver</p>
          <p>• Se possível, cite exemplos ou situações concretas</p>
          <p>• Use a prioridade "Urgente" apenas quando realmente necessário</p>
          <p>• Você pode enviar dúvidas anônimas se preferir</p>
        </CardContent>
      </Card>
    </div>
  );
}
