import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Award, Phone, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Profile() {
  const { user } = useAuth();
  const { data: teacher, isLoading: teacherLoading } = trpc.teachers.getCurrent.useQuery();
  const { data: professionalBand } = trpc.professionalBands.getById.useQuery(
    { id: teacher?.professionalBandId ?? 0 },
    { enabled: !!teacher?.professionalBandId }
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e profissionais
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Seus dados cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {user?.name ? getInitials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold">{user?.name || "Nome não disponível"}</h3>
                <p className="text-sm text-muted-foreground">Professor</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || "Não informado"}</p>
                </div>
              </div>

              {teacherLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  {teacher?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{teacher.phone}</p>
                      </div>
                    </div>
                  )}

                  {teacher?.specialization && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Especialização</p>
                        <p className="font-medium">{teacher.specialization}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => toast.info("Funcionalidade em breve")}
            >
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Professional Band Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Faixa Profissional
            </CardTitle>
            <CardDescription>
              Sua carga horária semanal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teacherLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : professionalBand ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: professionalBand.color || "#3b82f6" }}
                  />
                  <h3 className="text-xl font-semibold">{professionalBand.name}</h3>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Carga Total</span>
                    <Badge variant="secondary">{professionalBand.weeklyHours}h/semana</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aulas</span>
                    <span className="font-medium">{professionalBand.classHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Planejamento</span>
                    <span className="font-medium">{professionalBand.planningHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outras Atividades</span>
                    <span className="font-medium">{professionalBand.otherActivitiesHours}h</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => toast.info("Funcionalidade em breve")}
                >
                  Alterar Faixa
                </Button>
              </>
            ) : (
              <div className="text-center py-6">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma faixa profissional definida
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Funcionalidade em breve")}
                >
                  Definir Faixa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
