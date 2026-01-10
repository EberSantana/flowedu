import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Send, Upload, Mic, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { storagePut } from "../../../server/storage";

export default function PracticeQuestions() {
  const [, setLocation] = useLocation();
  
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPhotoUrl, setAnswerPhotoUrl] = useState("");
  const [answerAudioUrl, setAnswerAudioUrl] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Query para listar questões disponíveis
  const { data: questions, isLoading } = trpc.practiceQuestions.listByTeacher.useQuery({});
  
  // Mutation para submeter tentativa
  const submitAttempt = trpc.practiceQuestions.submitAttempt.useMutation({
    onSuccess: () => {
      toast.success("Questão enviada!", {
        description: "Sua resposta foi registrada com sucesso.",
      });
      // Resetar formulário
      setSelectedQuestion(null);
      setAnswerText("");
      setAnswerPhotoUrl("");
      setAnswerAudioUrl("");
      setStartTime(null);
      setElapsedTime(0);
      setLocation("/student/practice-history");
    },
    onError: (error) => {
      toast.error("Erro ao enviar", {
        description: error.message,
      });
    },
  });
  
  // Timer automático
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);
  
  // Iniciar questão
  const handleStartQuestion = (question: any) => {
    setSelectedQuestion(question);
    setStartTime(new Date());
    setElapsedTime(0);
  };
  
  // Upload de foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 16MB",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const fileName = `practice-answers/${Date.now()}-${file.name}`;
      
      const { url } = await storagePut(fileName, buffer, file.type);
      setAnswerPhotoUrl(url);
      
      toast.success("Foto enviada", {
        description: "Sua foto foi carregada com sucesso.",
      });
    } catch (error) {
      toast.error("Erro no upload", {
        description: "Não foi possível enviar a foto.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Upload de áudio
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 16 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 16MB",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const fileName = `practice-answers/${Date.now()}-${file.name}`;
      
      const { url } = await storagePut(fileName, buffer, file.type);
      setAnswerAudioUrl(url);
      
      toast.success("Áudio enviado", {
        description: "Seu áudio foi carregado com sucesso.",
      });
    } catch (error) {
      toast.error("Erro no upload", {
        description: "Não foi possível enviar o áudio.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Submeter resposta
  const handleSubmit = () => {
    if (!selectedQuestion || !startTime) return;
    
    if (!answerText && !answerPhotoUrl && !answerAudioUrl) {
      toast.error("Resposta vazia", {
        description: "Por favor, forneça uma resposta em texto, foto ou áudio.",
      });
      return;
    }
    
    const endTime = new Date();
    
    submitAttempt.mutate({
      practiceQuestionId: selectedQuestion.id,
      answerText: answerText || undefined,
      answerPhotoUrl: answerPhotoUrl || undefined,
      answerAudioUrl: answerAudioUrl || undefined,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      beltAtAttempt: "white", // TODO: pegar do perfil do aluno
      difficultyAtAttempt: selectedQuestion.difficulty,
    });
  };
  
  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>Carregando questões...</p>
      </div>
    );
  }
  
  // Modo de resolução de questão
  if (selectedQuestion) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedQuestion(null);
            setStartTime(null);
            setElapsedTime(0);
          }}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedQuestion.title}</CardTitle>
                <CardDescription>
                  Dificuldade: {selectedQuestion.difficulty} | Faixa: {selectedQuestion.belt}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Clock className="h-6 w-6" />
                {formatTime(elapsedTime)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enunciado */}
            <div>
              <Label className="text-lg font-semibold">Enunciado</Label>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                {selectedQuestion.description}
              </p>
            </div>
            
            {/* Resposta em texto */}
            <div>
              <Label htmlFor="answer">Sua Resposta (Texto)</Label>
              <Textarea
                id="answer"
                placeholder="Digite sua resposta aqui..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            
            {/* Upload de foto */}
            <div>
              <Label>Ou envie uma foto da sua resposta</Label>
              <div className="mt-2 flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {answerPhotoUrl ? "Foto enviada" : "Enviar foto"}
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                {answerPhotoUrl && (
                  <img src={answerPhotoUrl} alt="Preview" className="h-20 w-20 object-cover rounded" />
                )}
              </div>
            </div>
            
            {/* Upload de áudio */}
            <div>
              <Label>Ou grave/envie um áudio</Label>
              <div className="mt-2 flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {answerAudioUrl ? "Áudio enviado" : "Enviar áudio"}
                </Button>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleAudioUpload}
                />
                {answerAudioUrl && (
                  <audio src={answerAudioUrl} controls className="h-10" />
                )}
              </div>
            </div>
            
            {/* Botão de envio */}
            <Button
              onClick={handleSubmit}
              disabled={submitAttempt.isPending || isUploading}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitAttempt.isPending ? "Enviando..." : "Finalizar e Enviar Questão"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Lista de questões disponíveis
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Questões de Prática</h1>
        <p className="text-muted-foreground mt-2">
          Escolha uma questão para resolver e praticar seus conhecimentos
        </p>
      </div>
      
      {questions && questions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma questão disponível no momento.
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {questions?.map((question: any) => (
          <Card key={question.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="line-clamp-2">{question.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {question.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                    Faixa: {question.belt}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {question.description}
              </p>
              <Button
                onClick={() => handleStartQuestion(question)}
                className="w-full"
              >
                Começar Questão
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
