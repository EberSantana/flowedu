import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, ArrowLeft, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.loginStudent.useMutation({
    onSuccess: () => {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Portal do Aluno",
      });
      setLocation("/student-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registrationNumber || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha matrícula e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    loginMutation.mutate({ registrationNumber, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
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

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Portal do Aluno
            </h1>
            <p className="text-gray-600">
              Entre com sua matrícula e senha
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="registrationNumber" className="text-gray-700 font-medium">
                Número de Matrícula
              </Label>
              <Input
                id="registrationNumber"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Digite sua matrícula"
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="mt-1"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Sua senha é o mesmo número da sua matrícula
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Entrando...</>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          {/* Informações Adicionais */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Primeira vez acessando?</strong><br />
              Use sua matrícula como usuário e senha. Exemplo: se sua matrícula é "2024001", use:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• <strong>Matrícula:</strong> 2024001</li>
              <li>• <strong>Senha:</strong> 2024001</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Problemas para acessar? Entre em contato com seu professor</p>
        </div>
      </div>
    </div>
  );
}
