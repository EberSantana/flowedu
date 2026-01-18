import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function UserDebug() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <p className="text-center">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            🔍 Diagnóstico de Usuário
          </CardTitle>
          <CardDescription>
            Informações detalhadas sobre o usuário logado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status de Autenticação */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {isAuthenticated ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Autenticado</p>
                  <p className="text-sm text-gray-600">Usuário está logado no sistema</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Não Autenticado</p>
                  <p className="text-sm text-gray-600">Nenhum usuário logado</p>
                </div>
              </>
            )}
          </div>

          {user ? (
            <>
              {/* Dados do Usuário */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Dados do Usuário</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID</p>
                    <p className="font-mono font-semibold">{user.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold">{user.name || "-"}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{user.email || "-"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">OpenID</p>
                    <p className="font-mono text-xs">{user.openId}</p>
                  </div>
                </div>
              </div>

              {/* Role - DESTAQUE */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Role (Papel)</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {user.role || "❌ UNDEFINED"}
                    </p>
                  </div>
                  <div>
                    {user.role === "admin" ? (
                      <Badge className="text-lg px-4 py-2 bg-green-600">
                        ✅ ADMIN
                      </Badge>
                    ) : user.role === "user" ? (
                      <Badge className="text-lg px-4 py-2 bg-blue-600">
                        👤 USER
                      </Badge>
                    ) : (
                      <Badge className="text-lg px-4 py-2 bg-red-600">
                        ❌ INVÁLIDO
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Status da Conta</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">Ativo:</p>
                    {user.active ? (
                      <Badge className="bg-green-600">Sim</Badge>
                    ) : (
                      <Badge className="bg-red-600">Não</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">Aprovação:</p>
                    <Badge className={
                      user.approvalStatus === "approved" ? "bg-green-600" :
                      user.approvalStatus === "pending" ? "bg-yellow-600" :
                      "bg-red-600"
                    }>
                      {user.approvalStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* JSON Completo */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">JSON Completo</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs font-mono">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              {/* Alerta se role não for admin */}
              {user.role !== "admin" && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">⚠️ Problema Identificado</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      A role atual é "<strong>{user.role}</strong>" mas deveria ser "<strong>admin</strong>".
                      Isso significa que o JWT está desatualizado. Acesse <a href="/clear-session" className="underline font-semibold">/clear-session</a> para limpar e fazer novo login.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 text-gray-600">
              <p>Nenhum usuário logado</p>
              <a href="/login-professor" className="text-purple-600 underline mt-2 inline-block">
                Fazer Login
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
