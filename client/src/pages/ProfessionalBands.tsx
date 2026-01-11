import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Award, Clock, BookOpen, Users, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProfessionalBands() {
  const { data: bands, isLoading } = trpc.professionalBands.list.useQuery();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faixas Profissionais</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as faixas profissionais e cargas horárias
          </p>
        </div>
        <Button onClick={() => toast.info("Funcionalidade em breve")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Faixa
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : bands && bands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {bands.map((band) => (
            <Card key={band.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: band.color || "#3b82f6" }}
                    />
                    <CardTitle>{band.name}</CardTitle>
                  </div>
                  <Award className="h-5 w-5 text-primary" />
                </div>
                {band.description && (
                  <CardDescription className="line-clamp-2">
                    {band.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Carga Total</span>
                    </div>
                    <p className="text-2xl font-bold">{band.weeklyHours}h</p>
                    <p className="text-xs text-muted-foreground">por semana</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Aulas</span>
                    </div>
                    <p className="text-2xl font-bold">{band.classHours}h</p>
                    <p className="text-xs text-muted-foreground">semanais</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Planejamento</span>
                    </div>
                    <span className="font-medium">{band.planningHours}h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Outras Atividades</span>
                    </div>
                    <span className="font-medium">{band.otherActivitiesHours}h</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => toast.info("Funcionalidade em breve")}
                >
                  Editar Faixa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma faixa cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Adicione faixas profissionais para organizar as cargas horárias dos professores
            </p>
            <Button onClick={() => toast.info("Funcionalidade em breve")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Faixa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
