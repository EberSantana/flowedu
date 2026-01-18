import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function ClearSession() {
  const [, setLocation] = useLocation();

  const clearAndReload = () => {
    // Limpar todos os cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Limpar localStorage
    localStorage.clear();
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Redirecionar para login
    window.location.href = "/login-professor";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Limpar Sessão</CardTitle>
          <CardDescription>
            Clique no botão abaixo para limpar sua sessão e fazer um novo login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={clearAndReload}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar e Fazer Novo Login
          </Button>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Por que fazer isso?</strong><br />
              Se sua role foi atualizada no banco de dados mas o sistema ainda mostra a role antiga, você precisa fazer um novo login para atualizar o token JWT.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
