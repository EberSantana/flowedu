import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, KeyRound, UserPlus, ArrowLeft, Info } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Register() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const codeFromUrl = searchParams.get("code") || "";
  
  const [inviteCode, setInviteCode] = useState(codeFromUrl);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState(codeFromUrl ? "invite" : "manual");

  // Validar código quando digitado
  const validateCodeQuery = trpc.auth.validateInviteCode.useQuery(
    { code: inviteCode },
    {
      enabled: inviteCode.length >= 6,
      retry: false,
    }
  );

  useEffect(() => {
    if (inviteCode.length >= 6) {
      setIsValidating(true);
    } else {
      setValidationResult(null);
    }
  }, [inviteCode]);

  useEffect(() => {
    if (validateCodeQuery.data) {
      setValidationResult(validateCodeQuery.data);
      setIsValidating(false);
    }
  }, [validateCodeQuery.data]);

  const handleLoginWithInvite = () => {
    if (!validationResult?.valid) {
      toast.error("Por favor, insira um código de convite válido");
      return;
    }
    
    // Salvar código no localStorage para usar após o login OAuth
    localStorage.setItem("pendingInviteCode", inviteCode);
    localStorage.setItem("registrationType", "invite");
    
    // Redirecionar para login OAuth
    window.location.href = getLoginUrl();
  };

  const handleLoginWithoutInvite = () => {
    // Salvar tipo de registro no localStorage
    localStorage.setItem("registrationType", "manual");
    localStorage.removeItem("pendingInviteCode");
    
    // Redirecionar para login OAuth
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/10 to-accent/20 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Cadastro de Professor</CardTitle>
            <CardDescription>
              Escolha como deseja se cadastrar no sistema
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="invite" className="gap-2">
                  <KeyRound className="w-4 h-4" />
                  Com Código
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sem Código
                </TabsTrigger>
              </TabsList>

              {/* Aba: Com Código de Convite */}
              <TabsContent value="invite" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Código de Convite</Label>
                  <div className="relative">
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="Digite o código de convite"
                      className="pr-10 font-mono text-lg tracking-wider"
                      maxLength={20}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidating && (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      )}
                      {!isValidating && validationResult?.valid && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {!isValidating && validationResult && !validationResult.valid && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  {validationResult && (
                    <p className={`text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {validationResult.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Como funciona?</p>
                      <p>
                        O código de convite é fornecido pelo administrador do sistema.
                        Com ele, sua conta será aprovada automaticamente após o login.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleLoginWithInvite}
                  className="w-full"
                  disabled={!validationResult?.valid}
                >
                  Continuar com Google/GitHub
                </Button>
              </TabsContent>

              {/* Aba: Sem Código (Aprovação Manual) */}
              <TabsContent value="manual" className="space-y-4 mt-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Aprovação Pendente</p>
                      <p>
                        Ao se cadastrar sem código de convite, sua conta ficará pendente
                        de aprovação pelo administrador. Você receberá acesso assim que
                        sua conta for aprovada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Clique no botão abaixo para fazer login com sua conta Google ou GitHub.
                    Após o login, sua solicitação de acesso será enviada para aprovação.
                  </p>
                </div>

                <Button
                  onClick={handleLoginWithoutInvite}
                  className="w-full"
                  variant="outline"
                >
                  Solicitar Acesso (Google/GitHub)
                </Button>
              </TabsContent>
            </Tabs>

            {/* Já tem conta? */}
            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <a
                  href={getLoginUrl()}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Fazer login
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
