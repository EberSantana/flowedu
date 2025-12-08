import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, Clock, CalendarDays, User, Shield, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: subjects } = trpc.subjects.list.useQuery();
  const { data: classes } = trpc.classes.list.useQuery();
  const { data: scheduledClasses } = trpc.schedule.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bem-vindo, {user?.name || "Professor"}!
            </h1>
            <p className="text-gray-600">
              Sistema de Gestão de Tempo para Professores
            </p>
          </div>
          <div className="flex gap-2">
            {!user ? (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                <User className="mr-2 h-4 w-4" />
                Fazer Login
              </Button>
            ) : (
              <>
                <Link href="/profile">
                  <Button variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </Button>
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin/users">
                    <Button variant="outline" className="bg-purple-50 border-purple-200 hover:bg-purple-100">
                      <Shield className="mr-2 h-4 w-4 text-purple-600" />
                      Gerenciar Usuários
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects?.length || 0}</div>
              <p className="text-xs text-gray-600">disciplinas cadastradas</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turmas</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{classes?.length || 0}</div>
              <p className="text-xs text-gray-600">turmas cadastradas</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledClasses?.length || 0}</div>
              <p className="text-xs text-gray-600">aulas na grade</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carga Horária</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledClasses?.length || 0}h</div>
              <p className="text-xs text-gray-600">horas semanais</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/schedule">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Grade de Horários
                </Button>
              </Link>
              <Link href="/subjects">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Gerenciar Disciplinas
                </Button>
              </Link>
              <Link href="/classes">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Turmas
                </Button>
              </Link>
              <Link href="/shifts">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Configurar Turnos e Horários
                </Button>
              </Link>
              <Link href="/calendar">
                <Button className="w-full justify-start" variant="outline">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Calendário Anual
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Sobre o Sistema</CardTitle>
              <CardDescription>Funcionalidades disponíveis</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Cadastro e gerenciamento de disciplinas e turmas</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Visualização de grade de horários por turno</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Agendamento de aulas com validação de conflitos</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Organização por turnos: Matutino, Vespertino e Noturno</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
