import { ReactNode } from "react";
import { useUserProfile, UserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Lock, Sparkles } from "lucide-react";

interface FeatureGuardProps {
  children: ReactNode;
  requiredProfile: UserProfile;
  featureName: string;
}

const profileNames: Record<UserProfile, string> = {
  traditional: "Professor Tradicional",
  enthusiast: "Professor Entusiasta",
  interactive: "Professor Interativo",
  organizational: "Professor Organizacional",
};

export function FeatureGuard({ children, requiredProfile, featureName }: FeatureGuardProps) {
  const { profile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Perfil não encontrado
            </CardTitle>
            <CardDescription>
              Não foi possível carregar seu perfil de usuário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button className="w-full">
                Ir para Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profileOrder: UserProfile[] = ["traditional", "enthusiast", "interactive", "organizational"];
  const userProfileIndex = profileOrder.indexOf(profile);
  const requiredProfileIndex = profileOrder.indexOf(requiredProfile);

  // Se o perfil do usuário é suficiente, renderizar o conteúdo
  if (userProfileIndex >= requiredProfileIndex) {
    return <>{children}</>;
  }

  // Caso contrário, mostrar mensagem de bloqueio
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="max-w-lg border-2 border-amber-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lock className="h-6 w-6 text-amber-600" />
            Funcionalidade Bloqueada
          </CardTitle>
          <CardDescription className="text-base">
            Esta funcionalidade requer um perfil diferente
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              <strong>Funcionalidade:</strong> {featureName}
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <strong>Perfil atual:</strong> {profileNames[profile]}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Perfil necessário:</strong> {profileNames[requiredProfile]} ou superior
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  Desbloqueie mais funcionalidades!
                </p>
                <p className="text-sm text-purple-700">
                  Mude para o perfil <strong>{profileNames[requiredProfile]}</strong> para acessar
                  gamificação, gestão de alunos, exercícios e muito mais.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/profile" className="flex-1">
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Ir para Perfil
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
