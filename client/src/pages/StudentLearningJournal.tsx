import { useState } from "react";
import { trpc } from "@/lib/trpc";
import StudentLayout from "@/components/StudentLayout";
import { BookMarked, Plus, Calendar, Tag, Smile, Meh, Frown, Heart, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const moodIcons = {
  great: { icon: Heart, label: "Ótimo", color: "text-pink-500" },
  good: { icon: ThumbsUp, label: "Bom", color: "text-green-500" },
  neutral: { icon: Meh, label: "Neutro", color: "text-gray-500" },
  confused: { icon: Frown, label: "Confuso", color: "text-yellow-500" },
  frustrated: { icon: Frown, label: "Frustrado", color: "text-red-500" },
};

export default function StudentLearningJournal() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState<"great" | "good" | "neutral" | "confused" | "frustrated">("good");

  // Buscar entradas do diário
  const { data: entries, isLoading, refetch } = trpc.learningJournal.getMyEntries.useQuery({ limit: 50 });

  // Buscar disciplinas para seleção de tópico
  const { data: subjects } = trpc.student.getEnrolledSubjects.useQuery();

  // Mutation para adicionar entrada
  const addEntryMutation = trpc.learningJournal.addEntry.useMutation({
    onSuccess: () => {
      toast.success("✅ Entrada adicionada ao diário!");
      setIsDialogOpen(false);
      setContent("");
      setTags("");
      setMood("good");
      setSelectedTopicId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`❌ Erro ao adicionar entrada: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!selectedTopicId) {
      toast.error("Selecione um tópico");
      return;
    }
    if (!content.trim()) {
      toast.error("Escreva algo no diário");
      return;
    }

    addEntryMutation.mutate({
      topicId: selectedTopicId,
      content: content.trim(),
      tags: tags.trim() || undefined,
      mood,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <BookMarked className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Diário de Aprendizagem</h1>
                  <p className="text-blue-100 mt-1">
                    Registre suas reflexões, anotações e insights sobre cada tópico estudado
                  </p>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Entrada no Diário</DialogTitle>
                    <DialogDescription>
                      Registre suas reflexões e aprendizados sobre um tópico específico
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Tópico</Label>
                      <Select
                        value={selectedTopicId?.toString() || ""}
                        onValueChange={(value) => setSelectedTopicId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tópico" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects?.map((enrollment) => (
                            <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                              {enrollment.subject?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Como você se sentiu estudando este tópico?</Label>
                      <div className="flex gap-2 mt-2">
                        {Object.entries(moodIcons).map(([key, { icon: Icon, label, color }]) => (
                          <Button
                            key={key}
                            type="button"
                            variant={mood === key ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMood(key as any)}
                            className="flex-1"
                          >
                            <Icon className={`w-4 h-4 mr-1 ${mood === key ? "" : color}`} />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Suas Reflexões</Label>
                      <Textarea
                        placeholder="O que você aprendeu? Quais insights teve? O que ainda precisa revisar?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Tags (opcional)</Label>
                      <Input
                        placeholder="Ex: importante, revisar, dúvida"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={addEntryMutation.isPending}
                      >
                        {addEntryMutation.isPending ? "Salvando..." : "Salvar Entrada"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-4xl">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando diário...</p>
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-6">
              {entries.map((entry) => {
                const MoodIcon = moodIcons[entry.mood || "neutral"].icon;
                const moodColor = moodIcons[entry.mood || "neutral"].color;

                return (
                  <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MoodIcon className={`w-5 h-5 ${moodColor}`} />
                            Entrada do Diário
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(entry.entryDate)}
                          </CardDescription>
                        </div>
                        {entry.tags && (
                          <div className="flex gap-1 flex-wrap">
                            {entry.tags.split(",").map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookMarked className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Seu diário está vazio
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece a registrar suas reflexões e aprendizados
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeira Entrada
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
