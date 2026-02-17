import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [storageLimitMB, setStorageLimitMB] = useState<number>(500);
  const [storageInfo, setStorageInfo] = useState<{ totalSizeMB: string; fileCount: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar se é admin
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // Buscar limite atual
  const { data: storageLimitData, isLoading: loadingLimit } = trpc.admin.getStorageLimit.useQuery();
  
  const updateStorageLimitMutation = trpc.admin.updateStorageLimit.useMutation({
    onSuccess: (data) => {
      toast.success(`Limite de armazenamento atualizado para ${data.limitMB} MB`);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar limite: " + error.message);
      setIsSaving(false);
    },
  });

  // Carregar limite atual quando dados chegarem
  useEffect(() => {
    if (storageLimitData) {
      setStorageLimitMB(storageLimitData.limitMB);
    }
  }, [storageLimitData]);

  // Buscar info de armazenamento do servidor
  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const res = await fetch('/api/storage-info');
        if (res.ok) {
          const data = await res.json();
          setStorageInfo({ totalSizeMB: data.totalSizeMB, fileCount: data.fileCount });
        }
      } catch (e) {
        // Silently fail
      }
    };
    fetchStorageInfo();
  }, []);

  const handleSaveStorageLimit = () => {
    if (storageLimitMB < 50 || storageLimitMB > 10000) {
      toast.error("O limite deve estar entre 50 MB e 10.000 MB (10 GB)");
      return;
    }
    setIsSaving(true);
    updateStorageLimitMutation.mutate({ limitMB: storageLimitMB });
  };

  const usedPercentage = storageInfo
    ? (parseFloat(storageInfo.totalSizeMB) / storageLimitMB) * 100
    : 0;

  const getStorageStatusColor = () => {
    if (usedPercentage >= 90) return "text-red-600";
    if (usedPercentage >= 70) return "text-amber-600";
    return "text-green-600";
  };

  const getStorageBarColor = () => {
    if (usedPercentage >= 90) return "bg-red-500";
    if (usedPercentage >= 70) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <PageWrapper className="bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Configurações do Sistema
                </h1>
                <p className="text-gray-600 mt-1">
                  Gerencie as configurações globais da plataforma
                </p>
              </div>
            </div>
          </div>

          {/* Storage Limit Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle>Limite de Armazenamento</CardTitle>
              </div>
              <CardDescription>
                Defina o limite máximo de armazenamento de materiais didáticos no servidor.
                Este limite se aplica ao total de arquivos enviados por todos os professores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status atual */}
              {storageInfo && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Uso Atual do Armazenamento
                    </span>
                    <Badge variant={usedPercentage >= 90 ? "destructive" : usedPercentage >= 70 ? "secondary" : "default"}>
                      {usedPercentage.toFixed(1)}% usado
                    </Badge>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getStorageBarColor()}`}
                      style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-semibold ${getStorageStatusColor()}`}>
                      {storageInfo.totalSizeMB} MB usados
                    </span>
                    <span className="text-muted-foreground">
                      de {storageLimitMB} MB ({storageInfo.fileCount} arquivo{storageInfo.fileCount !== 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Alertas */}
                  {usedPercentage >= 90 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">
                        <strong>Atenção!</strong> O armazenamento está quase cheio. Considere aumentar o limite ou remover materiais antigos.
                      </p>
                    </div>
                  )}
                  {usedPercentage >= 70 && usedPercentage < 90 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700">
                        O armazenamento está acima de 70%. Monitore o uso para evitar problemas.
                      </p>
                    </div>
                  )}
                  {usedPercentage < 70 && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700">
                        Armazenamento dentro do limite. Tudo funcionando normalmente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Configuração do limite */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storage-limit" className="text-base font-medium">
                    Limite Máximo (MB)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="storage-limit"
                      type="number"
                      min={50}
                      max={10000}
                      step={50}
                      value={storageLimitMB}
                      onChange={(e) => setStorageLimitMB(parseInt(e.target.value) || 500)}
                      className="w-40"
                      disabled={loadingLimit}
                    />
                    <span className="text-sm text-muted-foreground">MB</span>
                    <span className="text-xs text-muted-foreground">
                      ({(storageLimitMB / 1024).toFixed(1)} GB)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo: 50 MB | Máximo: 10.000 MB (10 GB)
                  </p>
                </div>

                {/* Atalhos rápidos */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground mr-2 self-center">Atalhos:</span>
                  {[250, 500, 1000, 2000, 5000].map((value) => (
                    <Button
                      key={value}
                      variant={storageLimitMB === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStorageLimitMB(value)}
                    >
                      {value >= 1000 ? `${value / 1000} GB` : `${value} MB`}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleSaveStorageLimit}
                  disabled={isSaving || loadingLimit}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvando..." : "Salvar Limite"}
                </Button>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>O limite se aplica ao total de arquivos armazenados no servidor</li>
                    <li>Quando o uso atingir 80%, os professores verão um alerta ao fazer upload</li>
                    <li>Quando o limite for atingido, novos uploads serão bloqueados</li>
                    <li>Professores podem deletar materiais antigos para liberar espaço</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
