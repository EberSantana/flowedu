import { Link } from "wouter";
import { ArrowLeft, Users, FileText, ClipboardCheck, Bell, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function HelpAluno() {
  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/ajuda">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Central de Ajuda
              </Button>
            </Link>
            <div className="flex items-center mb-4">
              <Users className="h-10 w-10 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold">Manual do Aluno</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Guia completo para acessar trilhas, realizar atividades e acompanhar seu progresso
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
              <TabsTrigger value="exercicios">Exercícios</TabsTrigger>
              <TabsTrigger value="provas">Provas</TabsTrigger>
              <TabsTrigger value="perfil">Perfil</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard do Aluno</CardTitle>
                  <CardDescription>Sua página inicial após fazer login</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Após fazer login, você verá o <strong>Dashboard do Aluno</strong>, sua página inicial.</p>
                  
                  <div>
                    <h4 className="font-semibold mb-3">O que você encontra no Dashboard:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seção</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Menu Lateral</TableCell>
                          <TableCell>Navegação para todas as funcionalidades</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Minhas Turmas</TableCell>
                          <TableCell>Lista das turmas em que você está matriculado</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Próximas Atividades</TableCell>
                          <TableCell>Exercícios e provas com prazo próximo</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Avisos Recentes</TableCell>
                          <TableCell>Comunicados dos professores</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Meu Progresso</TableCell>
                          <TableCell>Resumo do seu desempenho</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">💡 Como Navegar:</h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>No Desktop:</strong> O menu lateral fica sempre visível à esquerda</li>
                      <li><strong>No Celular/Tablet:</strong> Clique no ícone de menu (☰) no canto superior</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trilhas Tab */}
            <TabsContent value="trilhas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Trilhas de Aprendizado
                  </CardTitle>
                  <CardDescription>
                    Sequências de conteúdos organizados pelo professor para guiar seu estudo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Acessar Trilhas</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Trilhas de Aprendizado"</strong></li>
                      <li>Você verá a lista de trilhas disponíveis para você</li>
                      <li>Cada trilha mostra: Nome, Disciplina, Seu progresso (%) e Número de módulos</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Iniciar uma Trilha</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Clique na trilha que deseja estudar</li>
                      <li>Você verá a descrição geral, lista de módulos e seu progresso atual</li>
                      <li>Clique no primeiro módulo (ou no módulo onde parou)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Estudar um Módulo</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Dentro do módulo, você verá os conteúdos disponíveis</li>
                      <li>Clique no primeiro conteúdo para começar</li>
                      <li>Estude o conteúdo:
                        <ul className="ml-6 mt-2 space-y-1 list-disc">
                          <li><strong>Texto:</strong> Leia com atenção</li>
                          <li><strong>Vídeo:</strong> Assista ao vídeo completo</li>
                          <li><strong>Arquivo:</strong> Baixe e leia o material</li>
                          <li><strong>Link:</strong> Acesse o site indicado</li>
                        </ul>
                      </li>
                      <li>Após concluir, clique em <strong>"Marcar como Concluído"</strong> ou <strong>"Próximo"</strong></li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">💡 Dicas para Estudar:</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Siga a ordem</TableCell>
                          <TableCell>Os módulos são organizados em sequência lógica</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Não pule conteúdos</TableCell>
                          <TableCell>Cada conteúdo prepara para o próximo</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Faça anotações</TableCell>
                          <TableCell>Anote os pontos importantes</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Revise</TableCell>
                          <TableCell>Volte aos módulos anteriores se tiver dúvidas</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exercícios Tab */}
            <TabsContent value="exercicios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 mr-2" />
                    Exercícios
                  </CardTitle>
                  <CardDescription>
                    Atividades práticas para você fixar o conteúdo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Acessar Exercícios</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Exercícios"</strong></li>
                      <li>Você verá a lista de exercícios disponíveis</li>
                      <li>Cada exercício mostra: Título, Disciplina, Status, Prazo e Sua nota (se já fez)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Realizar um Exercício</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Clique no exercício que deseja fazer</li>
                      <li>Leia as instruções com atenção</li>
                      <li>Clique em <strong>"Iniciar Exercício"</strong></li>
                      <li>Responda cada questão</li>
                      <li>Use os botões <strong>"Anterior"</strong> e <strong>"Próxima"</strong> para navegar</li>
                      <li>Quando terminar, clique em <strong>"Enviar Exercício"</strong></li>
                      <li>Confirme o envio</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Tipos de Questões</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Como Responder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Múltipla Escolha</TableCell>
                          <TableCell>Leia todas as alternativas e clique na correta</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Verdadeiro/Falso</TableCell>
                          <TableCell>Clique em "Verdadeiro" ou "Falso"</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Resposta Curta</TableCell>
                          <TableCell>Digite sua resposta no campo de texto</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Dissertativa</TableCell>
                          <TableCell>Escreva sua resposta completa no campo de texto</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">4. Ver Resultado</h3>
                    <p className="mb-2">Após enviar, você pode ver seu resultado (se o professor permitir):</p>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      <li>Sua nota</li>
                      <li>Questões certas e erradas</li>
                      <li>Gabarito (se disponível)</li>
                      <li>Explicação das respostas (se disponível)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">5. Refazer Exercício</h3>
                    <p className="text-sm">Se o professor permitir refazer, você verá o botão <strong>"Refazer Exercício"</strong>. Geralmente, a melhor nota é considerada.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Provas Tab */}
            <TabsContent value="provas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Provas
                  </CardTitle>
                  <CardDescription>
                    Avaliações formais com regras específicas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Acessar Provas</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Provas"</strong></li>
                      <li>Você verá a lista de provas:
                        <ul className="ml-6 mt-2 space-y-1 list-disc">
                          <li><strong>Próximas:</strong> Provas agendadas</li>
                          <li><strong>Em andamento:</strong> Provas que você pode fazer agora</li>
                          <li><strong>Concluídas:</strong> Provas já realizadas</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ IMPORTANTE: Antes da Prova</h4>
                    <p className="text-sm text-yellow-700 mb-3">Prepare-se antes de iniciar!</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Verificação</TableHead>
                          <TableHead>O que fazer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Internet</TableCell>
                          <TableCell>Certifique-se de ter conexão estável</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Bateria</TableCell>
                          <TableCell>Carregue seu dispositivo ou conecte na tomada</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Ambiente</TableCell>
                          <TableCell>Escolha um local silencioso e sem interrupções</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Tempo</TableCell>
                          <TableCell>Verifique se tem tempo suficiente para completar</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Realizar uma Prova</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Clique na prova disponível</li>
                      <li>Leia as instruções com <strong>MUITA ATENÇÃO</strong></li>
                      <li>Se houver senha, digite a senha fornecida pelo professor</li>
                      <li>Clique em <strong>"Iniciar Prova"</strong></li>
                      <li>⚠️ <strong>O cronômetro começa a contar!</strong></li>
                      <li>Responda cada questão com calma</li>
                      <li>Fique atento ao tempo restante (mostrado no topo da tela)</li>
                      <li>Quando terminar, clique em <strong>"Enviar Prova"</strong></li>
                      <li>Confirme o envio</li>
                    </ol>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">⚠️ REGRAS IMPORTANTES:</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Regra</TableHead>
                          <TableHead>Consequência</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Não feche a janela</TableCell>
                          <TableCell>Pode perder a prova</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Não troque de aba</TableCell>
                          <TableCell>O sistema pode registrar</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Não atualize a página</TableCell>
                          <TableCell>Pode perder respostas</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Fique atento ao tempo</TableCell>
                          <TableCell>A prova encerra automaticamente</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Se Tiver Problemas</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold mb-1">Se a internet cair:</p>
                        <ol className="space-y-1 list-decimal list-inside ml-4">
                          <li>Não entre em pânico</li>
                          <li>Reconecte à internet</li>
                          <li>Acesse o sistema novamente</li>
                          <li>A prova deve continuar de onde parou</li>
                          <li>Se não conseguir, entre em contato com o professor imediatamente</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Se o tempo acabar:</p>
                        <p className="ml-4">A prova será enviada automaticamente. As questões respondidas até aquele momento serão consideradas.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Perfil Tab */}
            <TabsContent value="perfil" className="space-y-6" id="perfil-progresso">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Meu Perfil e Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Acessar Meu Perfil</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Clique no seu nome ou foto no canto superior direito</li>
                      <li>Selecione <strong>"Meu Perfil"</strong> ou <strong>"Perfil"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Informações do Perfil</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Informação</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Dados Pessoais</TableCell>
                          <TableCell>Nome, e-mail, turma</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Progresso Geral</TableCell>
                          <TableCell>Porcentagem de conclusão das atividades</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Notas</TableCell>
                          <TableCell>Suas notas em exercícios e provas</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Faixa/Nível</TableCell>
                          <TableCell>Seu nível de progresso na disciplina</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Editar Perfil</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Na página do perfil, clique em <strong>"Editar Perfil"</strong></li>
                      <li>Você pode alterar: Foto de perfil, Senha e Preferências de notificação</li>
                      <li>Clique em <strong>"Salvar"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">4. Ver Progresso por Disciplina</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No perfil, clique em <strong>"Meu Progresso"</strong> ou <strong>"Desempenho"</strong></li>
                      <li>Selecione a disciplina</li>
                      <li>Você verá:
                        <ul className="ml-6 mt-2 space-y-1 list-disc">
                          <li>Progresso nas trilhas</li>
                          <li>Notas em exercícios</li>
                          <li>Notas em provas</li>
                          <li>Sua faixa/nível atual</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* Avisos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Avisos
                  </CardTitle>
                  <CardDescription>
                    Comunicados importantes dos professores
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Como acessar:</h4>
                    <ol className="space-y-1 list-decimal list-inside text-sm">
                      <li>No menu lateral, clique em <strong>"Avisos"</strong></li>
                      <li>Você verá a lista de avisos, organizados por data</li>
                      <li>Clique no aviso para ler o conteúdo completo</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">💡 Dicas sobre Avisos:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>🔴 <strong>Prioridade Alta:</strong> Avisos urgentes (vermelho)</li>
                      <li>🟡 <strong>Prioridade Normal:</strong> Avisos importantes (amarelo)</li>
                      <li>⚪ <strong>Informativo:</strong> Avisos gerais (cinza)</li>
                    </ul>
                    <p className="mt-3 text-sm font-semibold">Verifique os avisos diariamente!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Back to Help Button */}
          <div className="mt-8 text-center">
            <Link href="/ajuda">
              <Button variant="outline" size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Central de Ajuda
              </Button>
            </Link>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
