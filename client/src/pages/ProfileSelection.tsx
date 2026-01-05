import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Users, Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

type ProfileType = "traditional" | "enthusiast" | "interactive" | "organizational";

interface ProfileOption {
  id: ProfileType;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  badge?: string;
}

const profiles: ProfileOption[] = [
  {
    id: "traditional",
    name: "Professor Tradicional",
    description: "Foco no essencial: disciplinas, turmas e horários. Interface limpa e direta.",
    icon: <BookOpen className="h-8 w-8" />,
    features: [
      "Gerenciamento de disciplinas e turmas",
      "Grade de horários semanal",
      "Calendário anual",
      "Planos de curso",
      "Relatórios básicos",
    ],
    color: "bg-blue-500",
  },
  {
    id: "enthusiast",
    name: "Professor Entusiasta",
    description: "Todas as funcionalidades do sistema, incluindo gamificação e gestão de alunos.",
    icon: <Sparkles className="h-8 w-8" />,
    features: [
      "Tudo do perfil Tradicional",
      "Sistema de gamificação (pontos, avatares)",
      "Gestão completa de alunos",
      "Exercícios e avaliações",
      "Trilhas de aprendizagem",
      "Pensamento computacional",
    ],
    color: "bg-purple-500",
    badge: "Recomendado",
  },
  {
    id: "interactive",
    name: "Professor Interativo",
    description: "Ênfase em metodologias ativas e ferramentas pedagógicas inovadoras.",
    icon: <Users className="h-8 w-8" />,
    features: [
      "Tudo do perfil Entusiasta",
      "Biblioteca de metodologias ativas",
      "Ferramentas colaborativas",
      "Projetos interdisciplinares",
      "Avaliação por competências",
    ],
    color: "bg-green-500",
    badge: "Em breve",
  },
  {
    id: "organizational",
    name: "Professor Organizacional",
    description: "Máxima eficiência com automações, relatórios avançados e análise de dados.",
    icon: <Calendar className="h-8 w-8" />,
    features: [
      "Tudo do perfil Interativo",
      "Automações inteligentes",
      "Dashboards analíticos",
      "Relatórios personalizados",
      "Integração com sistemas externos",
    ],
    color: "bg-orange-500",
    badge: "Em breve",
  },
];

export default function ProfileSelection() {
  const [, setLocation] = useLocation();
  const { profile: currentProfile, refetch } = useUserProfile();
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const updateProfileMutation = trpc.userProfile.updateProfile.useMutation();

  const handleSelectProfile = async (profileId: ProfileType) => {
    // Perfis ainda não implementados
    if (profileId === "interactive" || profileId === "organizational") {
      toast.info("Este perfil estará disponível em breve!");
      return;
    }

    setSelectedProfile(profileId);

    try {
      await updateProfileMutation.mutateAsync({ profile: profileId });
      await refetch();
      toast.success(`Perfil alterado para ${profiles.find(p => p.id === profileId)?.name}!`);
      setLocation("/");
    } catch (error) {
      toast.error("Erro ao atualizar perfil. Tente novamente.");
      console.error(error);
    } finally {
      setSelectedProfile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Escolha seu Perfil de Professor
          </h1>
          <p className="text-lg text-slate-600">
            Personalize sua experiência de acordo com seu estilo de ensino
          </p>
          {currentProfile && (
            <Badge variant="outline" className="mt-3">
              Perfil atual: {profiles.find(p => p.id === currentProfile)?.name}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map((profile) => {
            const isSelected = currentProfile === profile.id;
            const isDisabled = profile.badge === "Em breve";

            return (
              <Card
                key={profile.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-primary" : ""
                } ${isDisabled ? "opacity-60" : "cursor-pointer"}`}
                onClick={() => !isDisabled && handleSelectProfile(profile.id)}
              >
                {profile.badge && (
                  <Badge
                    className={`absolute -top-3 -right-3 ${
                      profile.badge === "Recomendado"
                        ? "bg-purple-500"
                        : "bg-slate-400"
                    }`}
                  >
                    {profile.badge}
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${profile.color} text-white mb-3`}>
                      {profile.icon}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">Ativo</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{profile.name}</CardTitle>
                  <CardDescription className="text-base">
                    {profile.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      Funcionalidades incluídas:
                    </p>
                    <ul className="space-y-2">
                      {profile.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!isDisabled && (
                    <Button
                      className="w-full mt-6"
                      variant={isSelected ? "outline" : "default"}
                      disabled={selectedProfile === profile.id}
                    >
                      {selectedProfile === profile.id
                        ? "Aplicando..."
                        : isSelected
                        ? "Perfil Ativo"
                        : "Selecionar Perfil"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
