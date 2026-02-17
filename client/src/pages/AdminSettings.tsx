import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import {
  ArrowLeft,
  HardDrive,
  Save,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Users,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [editingUser, setEditingUser] = useState<{ userId: number; name: string; currentLimit: number } | null>(null);
  const [newLimit, setNewLimit] = useState<number>(1024);
  const [bulkLimit, setBulkLimit] = useState<number>(1024);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Verificar se é admin
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Buscar armazenamento de todos os professores
  const { data: teachersStorage, isLoading, refetch } = trpc.admin.getTeachersStorage.useQuery();

  const updateTeacherLimitMutation = trpc.admin.updateTeacherStorageLimit.useMutation({
    onSuccess: (data) => {
      toast.success(`Limite atualizado para ${data.limitMB} MB`);
      setEditingUser(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const updateAllLimitsMutation = trpc.admin.updateAllTeachersStorageLimit.useMutation({
    onSuccess: (data) => {
      toast.success(`Limite de ${data.updatedCount} professor(es) atualizado para ${data.limitMB} MB`);
      setIsSavingBulk(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
      setIsSavingBulk(false);
    },
  });

  const handleSaveIndividual = () => {
    if (!editingUser) return;
    if (newLimit < 50 || newLimit > 10000) {
      toast.error("O limite deve estar entre 50 MB e 10.000 MB");
      return;
    }
    updateTeacherLimitMutation.mutate({ professorId: editingUser.userId, limitMB: newLimit });
  };

  const handleSaveBulk = () => {
    if (bulkLimit < 50 || bulkLimit > 10000) {
      toast.error("O limite deve estar entre 50 MB e 10.000 MB");
      return;
    }
    setIsSavingBulk(true);
    updateAllLimitsMutation.mutate({ limitMB: bulkLimit });
  };

  // Calcular totais
  const totalUsedMB = teachersStorage?.reduce((sum, t) => sum + t.usedMB, 0) || 0;
  const totalFiles = teachersStorage?.reduce((sum, t) => sum + t.fileCount, 0) || 0;
  const teachersWithFiles = teachersStorage?.filter(t => t.fileCount > 0).length || 0;

  const getUsageColor = (usedMB: number, limitMB: number) => {
    const pct = (usedMB / limitMB) * 100;
    if (pct >= 90) return "text-red-600";
    if (pct >= 70) return "text-amber-600";
    return "text-green-600";
  };

  const getBarColor = (usedMB: number, limitMB: number) => {
    const pct = (usedMB / limitMB) * 100;
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  const getBadgeVariant = (usedMB: number, limitMB: number): "destructive" | "secondary" | "default" => {
    const pct = (usedMB / limitMB) * 100;
    if (pct >= 90) return "destructive";
    if (pct >= 70) return "secondary";
    return "default";
  };

  return (
    <PageWrapper className="bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin/users")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Administração
            </Button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Configurações do Sistema
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie os limites de armazenamento de cada professor
                </p>
              </div>
            </div>
          </div>

          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HardDrive className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Usado</p>
                    <p className="text-xl font-bold">{totalUsedMB.toFixed(1)} MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Professores com Arquivos</p>
                    <p className="text-xl font-bold">{teachersWithFiles} de {teachersStorage?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <HardDrive className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Arquivos</p>
                    <p className="text-xl font-bold">{totalFiles}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ajuste em Massa */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ajustar Limite para Todos os Professores
              </CardTitle>
              <CardDescription>
                Defina um limite padrão que será aplicado a todos os professores de uma vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-2">
                  <Label>Novo Limite (MB)</Label>
                  <Input
                    type="number"
                    min={50}
                    max={10000}
                    step={50}
                    value={bulkLimit}
                    onChange={(e) => setBulkLimit(parseInt(e.target.value) || 1024)}
                    className="w-40"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[256, 512, 1024, 2048, 5120].map((v) => (
                    <Button
                      key={v}
                      variant={bulkLimit === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBulkLimit(v)}
                    >
                      {v >= 1024 ? `${(v / 1024).toFixed(v % 1024 === 0 ? 0 : 1)} GB` : `${v} MB`}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleSaveBulk} disabled={isSavingBulk}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingBulk ? "Aplicando..." : "Aplicar a Todos"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Professores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Armazenamento por Professor
              </CardTitle>
              <CardDescription>
                Visualize e ajuste o limite de armazenamento de cada professor individualmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : !teachersStorage || teachersStorage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum professor encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {teachersStorage.map((teacher) => {
                    const pct = teacher.storageLimitMB > 0 ? (teacher.usedMB / teacher.storageLimitMB) * 100 : 0;
                    return (
                      <div
                        key={teacher.userId}
                        className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {(teacher.userName || "?")[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{teacher.userName || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground">{teacher.userEmail || "Sem email"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getBadgeVariant(teacher.usedMB, teacher.storageLimitMB)}>
                              {pct.toFixed(1)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingUser({
                                  userId: teacher.userId,
                                  name: teacher.userName || "Professor",
                                  currentLimit: teacher.storageLimitMB,
                                });
                                setNewLimit(teacher.storageLimitMB);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${getBarColor(teacher.usedMB, teacher.storageLimitMB)}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={getUsageColor(teacher.usedMB, teacher.storageLimitMB)}>
                            {teacher.usedMB.toFixed(1)} MB usados
                          </span>
                          <span>
                            Limite: {teacher.storageLimitMB >= 1024
                              ? `${(teacher.storageLimitMB / 1024).toFixed(teacher.storageLimitMB % 1024 === 0 ? 0 : 1)} GB`
                              : `${teacher.storageLimitMB} MB`}
                            {" "}({teacher.fileCount} arquivo{teacher.fileCount !== 1 ? "s" : ""})
                          </span>
                        </div>

                        {pct >= 90 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Armazenamento quase cheio!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <div className="mt-6 flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Como funciona o limite individual:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Cada professor tem seu próprio limite de armazenamento (padrão: 1 GB)</li>
                <li>Quando o uso atingir 80%, o professor verá um alerta ao fazer upload</li>
                <li>Quando o limite for atingido, novos uploads serão bloqueados para aquele professor</li>
                <li>Você pode ajustar o limite individualmente ou aplicar um valor para todos de uma vez</li>
                <li>O uso é calculado com base no tamanho dos arquivos enviados pelo professor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de edição individual */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Limite de {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Limite de Armazenamento (MB)</Label>
              <Input
                type="number"
                min={50}
                max={10000}
                step={50}
                value={newLimit}
                onChange={(e) => setNewLimit(parseInt(e.target.value) || 1024)}
              />
              <p className="text-xs text-muted-foreground">
                {newLimit >= 1024
                  ? `${(newLimit / 1024).toFixed(newLimit % 1024 === 0 ? 0 : 1)} GB`
                  : `${newLimit} MB`}
                {" "}| Mínimo: 50 MB | Máximo: 10 GB
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[256, 512, 1024, 2048, 5120].map((v) => (
                <Button
                  key={v}
                  variant={newLimit === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewLimit(v)}
                >
                  {v >= 1024 ? `${(v / 1024).toFixed(v % 1024 === 0 ? 0 : 1)} GB` : `${v} MB`}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveIndividual} disabled={updateTeacherLimitMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateTeacherLimitMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
