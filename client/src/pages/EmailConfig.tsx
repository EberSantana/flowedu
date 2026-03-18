import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mail,
  Server,
  Shield,
  TestTube,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Settings,
} from "lucide-react";

// Presets de servidores SMTP comuns
const SMTP_PRESETS = [
  {
    name: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    note: "Requer senha de app (não a senha normal). Ative a verificação em 2 etapas e gere uma senha de app em myaccount.google.com",
  },
  {
    name: "Outlook / Hotmail",
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    note: "Use seu e-mail e senha normais do Outlook/Hotmail",
  },
  {
    name: "Yahoo",
    host: "smtp.mail.yahoo.com",
    port: 587,
    secure: false,
    note: "Requer senha de app. Gere em Conta Yahoo > Segurança",
  },
  {
    name: "Zoho Mail",
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
    note: "Use seu e-mail e senha do Zoho",
  },
  {
    name: "Personalizado (SMTP próprio)",
    host: "",
    port: 587,
    secure: false,
    note: "Configure manualmente os dados do seu servidor SMTP institucional",
  },
];

export default function EmailConfig() {
  const { user } = useAuth();

  // Estado do formulário
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("FlowEdu");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [formLoaded, setFormLoaded] = useState(false);

  // Buscar configuração existente
  const { data: config, isLoading, refetch } = trpc.email.getConfig.useQuery();

  // Preencher formulário quando config carrega
  useEffect(() => {
    if (config && !formLoaded) {
      setSmtpHost(config.smtpHost);
      setSmtpPort(config.smtpPort);
      setSmtpSecure(config.smtpSecure);
      setSmtpUser(config.smtpUser);
      setFromEmail(config.fromEmail);
      setFromName(config.fromName);
      setIsActive(config.isActive);
      setTestEmail(config.smtpUser);
      setFormLoaded(true);
    }
  }, [config, formLoaded]);

  // Mutations
  const saveConfigMutation = trpc.email.saveConfig.useMutation({
    onSuccess: (data) => {
      toast.success(data.action === "created" ? "Configuração criada com sucesso!" : "Configuração atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const testConfigMutation = trpc.email.testConfig.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error("Falha no teste: " + error.message);
    },
  });

  const deleteConfigMutation = trpc.email.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração removida");
      setSmtpHost("");
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpUser("");
      setSmtpPassword("");
      setFromEmail("");
      setFromName("FlowEdu");
      setFormLoaded(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const handlePreset = (preset: (typeof SMTP_PRESETS)[0]) => {
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setSmtpSecure(preset.secure);
    toast.info(`Preset "${preset.name}" aplicado. ${preset.note}`);
  };

  const handleSave = () => {
    console.log("[EmailConfig] handleSave chamado", { smtpHost, smtpUser, smtpPassword: smtpPassword ? "***" : "(vazio)", fromEmail, fromName });
    
    if (!smtpHost) {
      toast.error("Informe o servidor SMTP");
      return;
    }
    if (!smtpUser) {
      toast.error("Informe o usuário SMTP");
      return;
    }
    if (!config && !smtpPassword) {
      toast.error("Informe a senha SMTP");
      return;
    }
    if (!fromEmail) {
      toast.error("Informe o e-mail remetente");
      return;
    }
    if (!fromName) {
      toast.error("Informe o nome remetente");
      return;
    }

    toast.info("Salvando configuração...");
    
    saveConfigMutation.mutate({
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword: smtpPassword || undefined,
      fromEmail,
      fromName,
      isActive,
    });
  };

  const handleTest = () => {
    if (!testEmail) return toast.error("Informe o e-mail para teste");
    testConfigMutation.mutate({ testEmail });
  };

  const getStatusBadge = () => {
    if (!config) return null;
    if (config.lastTestStatus === "success") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Testado com sucesso
        </Badge>
      );
    }
    if (config.lastTestStatus === "failed") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Falha no último teste
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Não testado
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <>
        <Sidebar />
        <PageWrapper className="min-h-screen bg-background">
          <div className="container mx-auto py-6 px-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          </div>
        </PageWrapper>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <PageWrapper className="min-h-screen bg-background">
        <div className="container mx-auto py-6 px-4">
          {/* Botão Voltar ao Dashboard */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary" />
                  Configuração de E-mail
                </h1>
                <p className="text-muted-foreground">Configure seu servidor SMTP para envio de e-mails institucionais</p>
              </div>
              {config && (
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  {config.lastTestedAt && (
                    <span className="text-xs text-gray-400">
                      Testado em {new Date(config.lastTestedAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aviso informativo */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como funciona?</p>
                <p>Configure aqui as credenciais do seu servidor SMTP institucional (Gmail, Outlook, servidor próprio, etc.). Após salvar, use o botão "Testar" para confirmar que o envio está funcionando. Depois, acesse <strong>Enviar E-mail</strong> para enviar mensagens para grupos de alunos.</p>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Atalhos de Configuração</h2>
              </div>
              <p className="text-sm text-gray-500 mb-4">Clique para preencher automaticamente as configurações do servidor</p>
              <div className="flex flex-wrap gap-2">
                {SMTP_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formulário SMTP */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Configurações do Servidor SMTP</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">Dados de conexão com o servidor de e-mail</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="smtpHost">Servidor SMTP (Host)</Label>
                    <Input
                      id="smtpHost"
                      placeholder="ex: smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpPort">Porta</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    id="smtpSecure"
                    checked={smtpSecure}
                    onCheckedChange={setSmtpSecure}
                  />
                  <div>
                    <Label htmlFor="smtpSecure" className="cursor-pointer font-medium">
                      Conexão SSL/TLS (porta 465)
                    </Label>
                    <p className="text-xs text-gray-500">
                      Desativado = STARTTLS (porta 587, recomendado). Ativado = SSL direto (porta 465).
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="smtpUser">Usuário SMTP (seu e-mail)</Label>
                  <Input
                    id="smtpUser"
                    type="email"
                    placeholder="seu.email@instituicao.edu.br"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="smtpPassword">
                    Senha SMTP
                    {config?.hasPassword && (
                      <span className="ml-2 text-xs text-green-600 font-normal">(senha salva — deixe em branco para manter)</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="smtpPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder={config?.hasPassword ? "••••••••" : "Senha do e-mail ou senha de app"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-amber-600">
                    ⚠️ Para Gmail: use uma "Senha de App" (não a senha da conta). Acesse myaccount.google.com → Segurança → Senhas de app.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remetente */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Dados do Remetente</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">Como seus e-mails aparecerão para os destinatários</p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fromName">Nome do Remetente</Label>
                    <Input
                      id="fromName"
                      placeholder="ex: Prof. João Silva"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fromEmail">E-mail do Remetente</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="seu.email@instituicao.edu.br"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Configuração ativa (permite envio de e-mails)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {config && (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Remover configuração de e-mail?")) {
                          deleteConfigMutation.mutate();
                        }
                      }}
                      disabled={deleteConfigMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover Configuração
                    </Button>
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={saveConfigMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveConfigMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                  </Button>

                  {config && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="E-mail para teste"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-56"
                      />
                      <Button
                        variant="outline"
                        onClick={handleTest}
                        disabled={testConfigMutation.isPending}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        {testConfigMutation.isPending ? "Testando..." : "Testar Envio"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Erro do último teste */}
          {config?.lastTestStatus === "failed" && config.lastTestError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-red-800 mb-1">Erro no último teste:</p>
                <p className="text-xs text-red-700 font-mono">{config.lastTestError}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrapper>
    </>
  );
}
