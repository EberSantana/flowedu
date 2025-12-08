import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Mail, Send, Copy, X, RefreshCw, AlertCircle, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Invitations() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [generatedLink, setGeneratedLink] = useState("");

  const { data: invitations, isLoading: invitationsLoading, refetch } = trpc.admin.listInvitations.useQuery();

  const createInvitationMutation = trpc.admin.createInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Convite criado com sucesso!");
      setGeneratedLink(data.inviteUrl);
      setEmail("");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const cancelInvitationMutation = trpc.admin.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Convite cancelado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resendInvitationMutation = trpc.admin.resendInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Convite reenviado com sucesso!");
      setGeneratedLink(data.inviteUrl);
      setIsDialogOpen(true);
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreateInvite = () => {
    if (!email) {
      toast.error("Por favor, informe o e-mail");
      return;
    }
    createInvitationMutation.mutate({ email, role });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleCancelInvite = (id: number) => {
    if (confirm("Tem certeza que deseja cancelar este convite?")) {
      cancelInvitationMutation.mutate({ id });
    }
  };

  const handleResendInvite = (id: number) => {
    resendInvitationMutation.mutate({ id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceito
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expirado
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Cancelado
          </span>
        );
      default:
        return status;
    }
  };

  if (loading || invitationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Você precisa estar logado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Acesso Negado</CardTitle>
            </div>
            <CardDescription>Apenas administradores podem acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingInvites = invitations?.filter(inv => inv.status === "pending") || [];
  const acceptedInvites = invitations?.filter(inv => inv.status === "accepted") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Mail className="w-10 h-10 text-indigo-600" />
            Gerenciamento de Convites
          </h1>
          <p className="text-slate-600">Convide novos professores para o sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingInvites.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Convites Aceitos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{acceptedInvites.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Convites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{invitations?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Novo Convite */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enviar Novo Convite</CardTitle>
            <CardDescription>Convide um novo professor para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email">E-mail do Professor</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="professor@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel no Sistema</Label>
                <Select value={role} onValueChange={(value: "user" | "admin") => setRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Professor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateInvite}
              disabled={createInvitationMutation.isPending}
              className="w-full mt-4"
            >
              <Send className="w-4 h-4 mr-2" />
              {createInvitationMutation.isPending ? "Enviando..." : "Enviar Convite"}
            </Button>

            {generatedLink && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Convite criado com sucesso!</p>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="text-sm" />
                  <Button onClick={handleCopyLink} variant="outline" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Compartilhe este link com o professor. O convite expira em 7 dias.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Convites */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Convites</CardTitle>
            <CardDescription>Visualize e gerencie todos os convites enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations?.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {inv.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {inv.role === "admin" ? (
                        <span className="text-purple-700 font-medium">Administrador</span>
                      ) : (
                        <span className="text-blue-700 font-medium">Professor</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(inv.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {inv.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(inv.id)}
                              disabled={resendInvitationMutation.isPending}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Reenviar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvite(inv.id)}
                              disabled={cancelInvitationMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
