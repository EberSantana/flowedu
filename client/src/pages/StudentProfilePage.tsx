import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Hash, Calendar, BookOpen } from "lucide-react";
import StudentLayout from '../components/StudentLayout';
import { trpc } from "../lib/trpc";

export default function StudentProfilePage() {
  const { student } = useStudentAuth();
  const { data: enrolledSubjects } = trpc.student.getEnrolledSubjects.useQuery();

  const activeCount = enrolledSubjects?.filter(e => e.status === 'active').length || 0;
  const completedCount = enrolledSubjects?.filter(e => e.status === 'completed').length || 0;

  return (
    <StudentLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Informações da sua conta de aluno</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal */}
        <Card className="lg:col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Suas informações de cadastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {student?.fullName?.charAt(0).toUpperCase() || 'A'}
              </div>
              
              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Nome Completo</label>
                  <p className="text-lg font-semibold text-gray-900">{student?.fullName || 'N/A'}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Hash className="w-3 h-3" />
                      Matrícula
                    </label>
                    <p className="font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                      {student?.registrationNumber || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3 h-3" />
                      Status
                    </label>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Card de Informações */}
        <Card className="lg:col-span-3 bg-white">
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
                <h4 className="font-semibold text-amber-800 mb-2">Dúvidas?</h4>
                <p className="text-sm text-amber-700">
                  Se tiver alguma dúvida sobre suas disciplinas ou matrícula,
                  entre em contato com seu professor responsável.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
