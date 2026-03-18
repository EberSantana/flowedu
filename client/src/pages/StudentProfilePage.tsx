import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Hash, Calendar, BookOpen, Edit2, Save, X, Shield } from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  nao_binario: "Não-binário",
  personalizar: "Personalizar",
  prefiro_nao_informar: "Prefiro não informar",
};

const PRONOUN_LABELS: Record<string, string> = {
  ele_dele: "Ele/Dele",
  ela_dela: "Ela/Dela",
  elu_delu: "Elu/Delu",
  prefiro_nao_informar: "Prefiro não informar",
};

export default function StudentProfilePage() {
  const { data: profile, isLoading, refetch } = trpc.student.getMyProfile.useQuery();
  const { data: enrolledSubjects } = trpc.student.getEnrolledSubjects.useQuery();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: "",
    birthDate: "",
    gender: "prefiro_nao_informar" as string,
    genderCustom: "",
    pronoun: "prefiro_nao_informar" as string,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        email: profile.email || "",
        birthDate: profile.birthDate || "",
        gender: profile.gender || "prefiro_nao_informar",
        genderCustom: profile.genderCustom || "",
        pronoun: profile.pronoun || "prefiro_nao_informar",
      });
    }
  }, [profile]);

  const updateMutation = trpc.student.updateMyProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setEditing(false);
      refetch();
      utils.student.getMyProfile.invalidate();
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      email: form.email || undefined,
      birthDate: form.birthDate || undefined,
      gender: form.gender as any,
      genderCustom: form.gender === "personalizar" ? form.genderCustom : undefined,
      pronoun: form.pronoun as any,
    });
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        email: profile.email || "",
        birthDate: profile.birthDate || "",
        gender: profile.gender || "prefiro_nao_informar",
        genderCustom: profile.genderCustom || "",
        pronoun: profile.pronoun || "prefiro_nao_informar",
      });
    }
    setEditing(false);
  };

  const activeCount = enrolledSubjects?.filter(e => e.status === 'active').length || 0;
  const completedCount = enrolledSubjects?.filter(e => e.status === 'completed').length || 0;

  // Formatar data de nascimento para exibição
  const formatBirthDate = (date: string | null | undefined) => {
    if (!date) return null;
    const parts = date.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return date;
  };

  return (
    <StudentLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Informações da sua conta de aluno</p>
        </div>
        {!editing && (
          <Button
            variant="outline"
            onClick={() => setEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal — Dados Pessoais */}
        <Card className="lg:col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              {editing ? "Edite suas informações abaixo e clique em Salvar" : "Suas informações de cadastro"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-gray-400 text-sm">Carregando...</div>
            ) : (
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
                  {profile?.fullName?.charAt(0).toUpperCase() || 'A'}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-5">
                  {/* Nome (somente leitura) */}
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Nome Completo</label>
                    <p className="text-lg font-semibold text-gray-900">{profile?.fullName || 'N/A'}</p>
                  </div>

                  {/* Matrícula (somente leitura) */}
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Hash className="w-3 h-3" />
                      Matrícula
                    </label>
                    <p className="font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded-lg inline-block">
                      {profile?.registrationNumber || 'N/A'}
                    </p>
                  </div>

                  {/* E-mail */}
                  <div>
                    <Label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3" />
                      E-mail
                    </Label>
                    {editing ? (
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="max-w-sm"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profile?.email || <span className="text-gray-400 italic">Não informado</span>}
                      </p>
                    )}
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <Label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      Data de Nascimento
                    </Label>
                    {editing ? (
                      <Input
                        type="date"
                        value={form.birthDate}
                        onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                        className="max-w-xs"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {formatBirthDate(profile?.birthDate) || <span className="text-gray-400 italic">Não informado</span>}
                      </p>
                    )}
                  </div>

                  {/* Gênero */}
                  <div>
                    <Label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3" />
                      Gênero
                    </Label>
                    {editing ? (
                      <div className="space-y-2">
                        <Select
                          value={form.gender}
                          onValueChange={v => setForm(f => ({ ...f, gender: v }))}
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="nao_binario">Não-binário</SelectItem>
                            <SelectItem value="personalizar">Personalizar</SelectItem>
                            <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.gender === "personalizar" && (
                          <Input
                            placeholder="Descreva seu gênero..."
                            value={form.genderCustom}
                            onChange={e => setForm(f => ({ ...f, genderCustom: e.target.value }))}
                            className="max-w-xs"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {profile?.gender === "personalizar" && profile?.genderCustom
                          ? profile.genderCustom
                          : GENDER_LABELS[profile?.gender || ""] || <span className="text-gray-400 italic">Não informado</span>}
                      </p>
                    )}
                  </div>

                  {/* Pronome */}
                  <div>
                    <Label className="text-sm text-gray-500 block mb-1">
                      Pronome de Tratamento
                    </Label>
                    {editing ? (
                      <Select
                        value={form.pronoun}
                        onValueChange={v => setForm(f => ({ ...f, pronoun: v }))}
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ele_dele">Ele/Dele</SelectItem>
                          <SelectItem value="ela_dela">Ela/Dela</SelectItem>
                          <SelectItem value="elu_delu">Elu/Delu</SelectItem>
                          <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-900">
                        {PRONOUN_LABELS[profile?.pronoun || ""] || <span className="text-gray-400 italic">Não informado</span>}
                      </p>
                    )}
                  </div>

                  {/* Botões de ação */}
                  {editing && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Estatísticas */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              Resumo Acadêmico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Disciplinas Ativas</span>
                <span className="text-2xl font-bold text-green-600">{activeCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Concluídas</span>
                <span className="text-2xl font-bold text-blue-600">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-2xl font-bold text-purple-600">{enrolledSubjects?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Status */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Ativo
            </Badge>
          </CardContent>
        </Card>

        {/* Card de Informações */}
        <Card className="lg:col-span-2 bg-white">
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">Acesso ao Sistema</h4>
                <p className="text-sm text-blue-700">
                  Seu login é feito usando o número de matrícula como usuário e senha.
                  Para alterar sua senha, entre em contato com seu professor.
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-800 mb-2">Privacidade</h4>
                <p className="text-sm text-amber-700">
                  Seus dados de gênero e pronome são opcionais e tratados com total
                  confidencialidade. Você pode escolher "Prefiro não informar" a qualquer momento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
