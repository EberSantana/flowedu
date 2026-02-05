import { Link } from "wouter";
import { ArrowLeft, BookOpen, Users, FileText, ClipboardList, Bell, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function HelpProfessor() {
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
              <BookOpen className="h-10 w-10 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold">Manual do Professor</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Guia completo para gerenciar turmas, criar conteúdo e acompanhar o desempenho dos alunos
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="turmas">Turmas</TabsTrigger>
              <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
              <TabsTrigger value="exercicios">Exercícios</TabsTrigger>
              <TabsTrigger value="provas">Provas</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard do Professor</CardTitle>
                  <CardDescription>Sua página inicial após fazer login</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Após fazer login, você verá o <strong>Dashboard do Professor</strong>, que é sua página inicial.</p>
                  
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
                          <TableCell>Navegação para todas as funcionalidades do sistema</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Resumo Geral</TableCell>
                          <TableCell>Visão geral das turmas, alunos e atividades</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Atividades Recentes</TableCell>
                          <TableCell>Últimas ações realizadas no sistema</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Notificações</TableCell>
                          <TableCell>Alertas importantes sobre o sistema</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">💡 Como Navegar:</h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>No Desktop:</strong> O menu lateral fica sempre visível à esquerda da tela</li>
                      <li><strong>No Celular/Tablet:</strong> Clique no ícone de menu (☰) no canto superior para abrir</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Turmas Tab */}
            <TabsContent value="turmas" className="space-y-6" id="gerenciar-turmas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Gerenciar Turmas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Visualizar Turmas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Visualizar Turmas</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Turmas"</strong></li>
                      <li>Você verá a lista de todas as suas turmas</li>
                      <li>Cada turma mostra: Nome, Quantidade de alunos, Disciplina e Status</li>
                    </ol>
                  </div>

                  {/* Criar Nova Turma */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Criar Nova Turma</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Na página de Turmas, clique no botão <strong>"+ Nova Turma"</strong></li>
                      <li>Preencha os campos obrigatórios:</li>
                    </ol>
                    
                    <Table className="mt-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          <TableHead>O que preencher</TableHead>
                          <TableHead>Exemplo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Nome da Turma</TableCell>
                          <TableCell>Nome identificador da turma</TableCell>
                          <TableCell>"3º Ano A - Matemática"</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Disciplina</TableCell>
                          <TableCell>Selecione a disciplina</TableCell>
                          <TableCell>"Matemática"</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Ano/Série</TableCell>
                          <TableCell>Selecione o ano escolar</TableCell>
                          <TableCell>"3º Ano"</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Período</TableCell>
                          <TableCell>Manhã, Tarde ou Noite</TableCell>
                          <TableCell>"Manhã"</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <ol start={3} className="space-y-2 list-decimal list-inside mt-3">
                      <li>Clique em <strong>"Salvar"</strong> ou <strong>"Criar Turma"</strong></li>
                      <li>A turma será criada e aparecerá na lista</li>
                    </ol>
                  </div>

                  {/* Editar/Excluir */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Editar ou Excluir Turma</h3>
                    <p className="mb-2"><strong>Para Editar:</strong></p>
                    <ol className="space-y-2 list-decimal list-inside mb-4">
                      <li>Encontre a turma na lista</li>
                      <li>Clique no ícone de <strong>lápis (✏️)</strong> ou no botão <strong>"Editar"</strong></li>
                      <li>Faça as alterações necessárias</li>
                      <li>Clique em <strong>"Salvar"</strong></li>
                    </ol>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="font-semibold text-red-800 mb-2">⚠️ ATENÇÃO: Excluir Turma</p>
                      <p className="text-sm text-red-700">Excluir uma turma remove todos os dados associados a ela!</p>
                      <ol className="space-y-1 list-decimal list-inside mt-2 text-sm text-red-700">
                        <li>Clique no ícone de <strong>lixeira (🗑️)</strong></li>
                        <li>Confirme a exclusão quando solicitado</li>
                      </ol>
                    </div>
                  </div>

                  {/* Adicionar Alunos */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">4. Adicionar Alunos à Turma</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Acesse a turma desejada clicando nela</li>
                      <li>Clique em <strong>"+ Adicionar Aluno"</strong></li>
                      <li>Busque aluno existente ou cadastre novo aluno</li>
                      <li>Selecione o(s) aluno(s) desejado(s)</li>
                      <li>Clique em <strong>"Adicionar"</strong></li>
                    </ol>
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
                    Criar Trilhas de Aprendizado
                  </CardTitle>
                  <CardDescription>
                    Sequências de conteúdos organizados para guiar o aprendizado do aluno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Criar Nova Trilha</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Trilhas de Aprendizado"</strong></li>
                      <li>Clique no botão <strong>"+ Nova Trilha"</strong></li>
                      <li>Preencha as informações básicas (título, descrição, disciplina, turmas)</li>
                      <li>Clique em <strong>"Próximo"</strong> ou <strong>"Criar"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Adicionar Módulos</h3>
                    <p className="mb-3">Após criar a trilha, adicione módulos (unidades de conteúdo):</p>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>Clique em <strong>"+ Adicionar Módulo"</strong></li>
                      <li>Preencha: Título do Módulo, Descrição e Ordem</li>
                      <li>Clique em <strong>"Salvar Módulo"</strong></li>
                      <li>Repita para adicionar mais módulos</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Adicionar Conteúdo aos Módulos</h3>
                    <p className="mb-3">Tipos de conteúdo disponíveis:</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Uso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Texto</TableCell>
                          <TableCell>Conteúdo escrito</TableCell>
                          <TableCell>Explicações, teoria</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Vídeo</TableCell>
                          <TableCell>Link de vídeo</TableCell>
                          <TableCell>Aulas em vídeo</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Arquivo</TableCell>
                          <TableCell>PDF, documento</TableCell>
                          <TableCell>Material de apoio</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Link</TableCell>
                          <TableCell>Link externo</TableCell>
                          <TableCell>Sites de referência</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Exercício</TableCell>
                          <TableCell>Atividade prática</TableCell>
                          <TableCell>Fixação do conteúdo</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-semibold text-yellow-800 mb-2">⚠️ IMPORTANTE: Publicar Trilha</p>
                    <p className="text-sm text-yellow-700">
                      A trilha só ficará visível para os alunos após ser publicada! Após adicionar todo o conteúdo, 
                      clique em <strong>"Publicar Trilha"</strong> e confirme.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exercícios Tab */}
            <TabsContent value="exercicios" className="space-y-6" id="criar-exercicios">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="h-5 w-5 mr-2" />
                    Criar Exercícios
                  </CardTitle>
                  <CardDescription>
                    Atividades para os alunos praticarem o conteúdo aprendido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Criar Novo Exercício</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Exercícios"</strong></li>
                      <li>Clique no botão <strong>"+ Novo Exercício"</strong></li>
                      <li>Preencha: Título, Descrição, Disciplina, Turma(s), Data de Entrega e Pontuação</li>
                      <li>Clique em <strong>"Próximo"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Adicionar Questões</h3>
                    <p className="mb-3">Tipos de questões disponíveis:</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Correção</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Múltipla Escolha</TableCell>
                          <TableCell>Várias opções, uma correta</TableCell>
                          <TableCell>Automática</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Verdadeiro/Falso</TableCell>
                          <TableCell>Duas opções</TableCell>
                          <TableCell>Automática</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Resposta Curta</TableCell>
                          <TableCell>Texto breve</TableCell>
                          <TableCell>Manual ou Automática</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Dissertativa</TableCell>
                          <TableCell>Texto longo</TableCell>
                          <TableCell>Manual</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="mt-4">
                      <p className="font-semibold mb-2">Para Múltipla Escolha:</p>
                      <ol className="space-y-1 list-decimal list-inside text-sm">
                        <li>Digite o enunciado da questão</li>
                        <li>Adicione as alternativas (A, B, C, D, E)</li>
                        <li>Marque a alternativa correta</li>
                        <li>(Opcional) Adicione explicação da resposta</li>
                        <li>Defina a pontuação da questão</li>
                        <li>Clique em <strong>"Salvar Questão"</strong></li>
                      </ol>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Configurar Exercício</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Opção</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Recomendação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Embaralhar questões</TableCell>
                          <TableCell>Ordem aleatória das questões</TableCell>
                          <TableCell>Sim (evita cola)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Embaralhar alternativas</TableCell>
                          <TableCell>Ordem aleatória das opções</TableCell>
                          <TableCell>Sim</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mostrar resultado</TableCell>
                          <TableCell>Aluno vê nota após enviar</TableCell>
                          <TableCell>Configurar conforme necessidade</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Permitir refazer</TableCell>
                          <TableCell>Aluno pode tentar novamente</TableCell>
                          <TableCell>Configurar conforme necessidade</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">4. Publicar e Exportar</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold mb-1">Publicar:</p>
                        <ol className="space-y-1 list-decimal list-inside text-sm">
                          <li>Revise todas as questões</li>
                          <li>Clique em <strong>"Publicar Exercício"</strong></li>
                          <li>Confirme a publicação</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Exportar para Word (DOCX):</p>
                        <ol className="space-y-1 list-decimal list-inside text-sm">
                          <li>Na página do exercício, clique em <strong>"Exportar"</strong></li>
                          <li>Selecione o formato <strong>"DOCX (Word)"</strong></li>
                          <li>O arquivo será baixado automaticamente</li>
                        </ol>
                      </div>
                    </div>
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
                    Criar Provas
                  </CardTitle>
                  <CardDescription>
                    Avaliações formais com maior peso na nota do aluno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">1. Criar Nova Prova</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Provas"</strong></li>
                      <li>Clique no botão <strong>"+ Nova Prova"</strong></li>
                      <li>Preencha: Título, Descrição, Disciplina, Turma(s), Data, Horário, Duração e Valor Total</li>
                      <li>Clique em <strong>"Próximo"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">2. Adicionar Questões</h3>
                    <p className="text-sm">O processo é similar ao de exercícios:</p>
                    <ol className="space-y-1 list-decimal list-inside text-sm mt-2">
                      <li>Clique em <strong>"+ Adicionar Questão"</strong></li>
                      <li>Selecione o tipo e preencha a questão</li>
                      <li>Defina a pontuação</li>
                      <li>Salve e repita para todas as questões</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">3. Configurações Especiais</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Opção</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Recomendação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Bloquear navegação</TableCell>
                          <TableCell>Impede aluno de sair da prova</TableCell>
                          <TableCell>Sim</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Tempo limite</TableCell>
                          <TableCell>Encerra automaticamente</TableCell>
                          <TableCell>Sim</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Uma questão por vez</TableCell>
                          <TableCell>Mostra questões individualmente</TableCell>
                          <TableCell>Opcional</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Senha de acesso</TableCell>
                          <TableCell>Senha para iniciar a prova</TableCell>
                          <TableCell>Recomendado</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">4. Publicar e Exportar</h3>
                    <p className="mb-2">A prova ficará disponível na data/hora configurada após publicação.</p>
                    <p className="text-sm">Para exportar para Word, siga o mesmo processo dos exercícios.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Relatórios Tab */}
            <TabsContent value="relatorios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Relatórios e Acompanhamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Tipos de Relatórios</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Relatório</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Por Turma</TableCell>
                          <TableCell>Desempenho geral da turma</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Por Aluno</TableCell>
                          <TableCell>Desempenho individual</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Por Atividade</TableCell>
                          <TableCell>Resultados de exercícios/provas</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Progresso nas Trilhas</TableCell>
                          <TableCell>Avanço nas trilhas de aprendizado</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Gerar Relatório</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                      <li>No menu lateral, clique em <strong>"Relatórios"</strong></li>
                      <li>Selecione o tipo de relatório desejado</li>
                      <li>Escolha a turma ou aluno</li>
                      <li>Selecione o período (bimestre, semestre, ano)</li>
                      <li>Clique em <strong>"Gerar Relatório"</strong></li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Exportar Relatórios</h3>
                    <p className="mb-2">Após gerar o relatório, você pode exportá-lo em:</p>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      <li><strong>DOCX</strong> (Word) - Formato editável</li>
                      <li><strong>TXT</strong> (Texto simples) - Formato básico</li>
                    </ul>
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
