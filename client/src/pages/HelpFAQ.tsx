import { Link } from "wouter";
import { ArrowLeft, HelpCircle, GraduationCap, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function HelpFAQ() {
  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/ajuda">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Central de Ajuda
              </Button>
            </Link>
            <div className="flex items-center mb-4">
              <HelpCircle className="h-10 w-10 text-purple-600 mr-3" />
              <h1 className="text-3xl font-bold">Perguntas Frequentes (FAQ)</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Respostas rápidas para as dúvidas mais comuns
            </p>
          </div>

          {/* Tabs for Professor/Aluno */}
          <Tabs defaultValue="professor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="professor" className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Para Professores
              </TabsTrigger>
              <TabsTrigger value="aluno" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Para Alunos
              </TabsTrigger>
            </TabsList>

            {/* FAQ Professor */}
            <TabsContent value="professor" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dúvidas Comuns - Professores</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        Como faço para ver quais alunos já fizeram um exercício?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para ver quem já fez o exercício:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Acesse o exercício</li>
                            <li>Clique em <strong>"Ver Respostas"</strong> ou <strong>"Resultados"</strong></li>
                            <li>Você verá a lista de alunos com status (Pendente, Concluído) e notas</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        Posso editar um exercício depois de publicado?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Depende:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Se <strong>nenhum aluno respondeu ainda</strong>, você pode editar normalmente</li>
                            <li>Se <strong>já houver respostas</strong>, algumas alterações podem não ser possíveis para manter a integridade dos dados</li>
                          </ul>
                          <p className="mt-2">💡 <strong>Dica:</strong> Sempre revise bem antes de publicar!</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        Como corrijo questões dissertativas?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para corrigir questões dissertativas:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Acesse o exercício/prova</li>
                            <li>Clique em <strong>"Corrigir"</strong></li>
                            <li>Você verá as respostas de cada aluno</li>
                            <li>Atribua a nota para cada resposta</li>
                            <li>Opcionalmente, adicione comentários</li>
                            <li>Salve a correção</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger>
                        Posso copiar um exercício para outra turma?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Sim!</strong> Para copiar um exercício:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Acesse o exercício</li>
                            <li>Clique em <strong>"Duplicar"</strong> ou <strong>"Copiar"</strong></li>
                            <li>Selecione a nova turma</li>
                            <li>Faça as alterações necessárias (se houver)</li>
                            <li>Publique o exercício copiado</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger>
                        Como exporto exercícios e provas para Word?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para exportar para Word (DOCX):</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Na página do exercício/prova, clique em <strong>"Exportar"</strong></li>
                            <li>Selecione o formato <strong>"DOCX (Word)"</strong></li>
                            <li>Escolha se quer exportar:
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Apenas a prova (sem gabarito)</li>
                                <li>Prova com gabarito</li>
                                <li>Apenas gabarito</li>
                              </ul>
                            </li>
                            <li>O arquivo será baixado automaticamente</li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-6">
                      <AccordionTrigger>
                        Como adiciono alunos a uma turma?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para adicionar alunos:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Acesse a turma desejada</li>
                            <li>Clique em <strong>"+ Adicionar Aluno"</strong></li>
                            <li>Você pode:
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li><strong>Buscar aluno existente:</strong> Digite o nome ou e-mail</li>
                                <li><strong>Cadastrar novo aluno:</strong> Preencha os dados</li>
                              </ul>
                            </li>
                            <li>Selecione o(s) aluno(s)</li>
                            <li>Clique em <strong>"Adicionar"</strong></li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Aluno */}
            <TabsContent value="aluno" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dúvidas Comuns - Alunos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" id="senha">
                      <AccordionTrigger>
                        Esqueci minha senha. O que faço?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para redefinir sua senha:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Na tela de login, clique em <strong>"Esqueci minha senha"</strong></li>
                            <li>Digite seu e-mail cadastrado</li>
                            <li>Você receberá um e-mail com instruções</li>
                            <li>Siga as instruções para criar uma nova senha</li>
                          </ol>
                          <p className="mt-2">⚠️ Se não receber o e-mail, verifique a pasta de spam ou entre em contato com o professor.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                        Não consigo acessar um exercício. O que fazer?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Verifique:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Se o <strong>prazo não expirou</strong></li>
                            <li>Se você está na <strong>turma correta</strong></li>
                            <li>Se o exercício foi <strong>publicado pelo professor</strong></li>
                            <li>Se você já não <strong>completou o exercício</strong> (e não pode refazer)</li>
                          </ol>
                          <p className="mt-2">Se o problema persistir, entre em contato com o professor.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger>
                        Minha internet caiu durante a prova. Perdi tudo?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Não necessariamente!</strong></p>
                          <p>O sistema salva suas respostas periodicamente. Para continuar:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Reconecte à internet o mais rápido possível</li>
                            <li>Acesse o sistema novamente</li>
                            <li>A prova deve continuar de onde parou</li>
                          </ol>
                          <p className="mt-2">⚠️ <strong>IMPORTANTE:</strong> Se tiver problemas, entre em contato com o professor <strong>imediatamente</strong> explicando o que aconteceu.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger>
                        Posso fazer exercícios pelo celular?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Sim!</strong> O sistema funciona em celulares e tablets.</p>
                          <p className="mt-2">💡 <strong>Recomendação:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li><strong>Exercícios:</strong> Podem ser feitos no celular sem problemas</li>
                            <li><strong>Provas:</strong> Recomendamos usar um computador para evitar problemas técnicos</li>
                          </ul>
                          <p className="mt-2">Certifique-se de ter uma conexão estável!</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger>
                        Como sei se tenho atividades pendentes?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Você pode ver suas atividades pendentes de duas formas:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li><strong>No Dashboard:</strong> Veja a seção <strong>"Próximas Atividades"</strong> ou <strong>"Pendentes"</strong></li>
                            <li><strong>No menu Exercícios:</strong> Acesse <strong>"Exercícios"</strong> e filtre por <strong>"Pendentes"</strong></li>
                          </ol>
                          <p className="mt-2">💡 <strong>Dica:</strong> Verifique o dashboard diariamente para não perder prazos!</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-6">
                      <AccordionTrigger>
                        Posso refazer um exercício para melhorar minha nota?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Depende da configuração do professor.</strong></p>
                          <p>Se permitido, você verá o botão <strong>"Refazer"</strong> na página do exercício.</p>
                          <p className="mt-2">📝 <strong>Nota:</strong> Geralmente, a <strong>melhor nota</strong> é considerada, mas isso pode variar conforme a configuração do professor.</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-7">
                      <AccordionTrigger>
                        Como vejo minhas notas e progresso?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Para ver suas notas e progresso:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Clique no seu nome ou foto no canto superior direito</li>
                            <li>Selecione <strong>"Meu Perfil"</strong></li>
                            <li>Você verá:
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Progresso geral</li>
                                <li>Notas em exercícios</li>
                                <li>Notas em provas</li>
                                <li>Progresso nas trilhas de aprendizado</li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-8">
                      <AccordionTrigger>
                        O que fazer se encontrar um erro no sistema?
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>Se encontrar um erro:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Tente <strong>atualizar a página</strong> (pressione F5 ou Ctrl+R)</li>
                            <li>Tente <strong>limpar o cache do navegador</strong></li>
                            <li>Tente usar <strong>outro navegador</strong> (Chrome, Firefox, Edge)</li>
                            <li>Verifique sua <strong>conexão com a internet</strong></li>
                          </ol>
                          <p className="mt-2">Se o problema persistir:</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Entre em contato com o professor</li>
                            <li>Ou envie um e-mail para: <strong>suporte@flowedu.app</strong></li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Contact Support Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Não encontrou sua resposta?</CardTitle>
              <CardDescription>
                Nossa equipe está pronta para ajudar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  Se sua dúvida não foi respondida aqui, você pode:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <GraduationCap className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-semibold text-sm">Professores</p>
                      <p className="text-sm text-muted-foreground">
                        Entre em contato diretamente com o suporte técnico
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <p className="font-semibold text-sm">Alunos</p>
                      <p className="text-sm text-muted-foreground">
                        Fale primeiro com seu professor ou coordenador
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <a href="mailto:suporte@flowedu.app">
                    Entrar em Contato com Suporte
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

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
