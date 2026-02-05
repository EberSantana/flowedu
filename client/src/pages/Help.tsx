import { Link } from "wouter";
import { 
  BookOpen, 
  GraduationCap, 
  HelpCircle, 
  Search, 
  Video,
  Mail,
  FileText,
  Users,
  Copy,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import PageWrapper from "@/components/PageWrapper";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpSections = [
    {
      title: "Manual do Professor",
      description: "Guia completo para professores: gerenciar turmas, criar exercícios, provas e trilhas de aprendizado",
      icon: GraduationCap,
      href: "/ajuda/professor",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Manual do Aluno",
      description: "Guia completo para alunos: acessar trilhas, fazer exercícios, provas e acompanhar progresso",
      icon: Users,
      href: "/ajuda/aluno",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Perguntas Frequentes",
      description: "Respostas rápidas para as dúvidas mais comuns de professores e alunos",
      icon: HelpCircle,
      href: "/ajuda/faq",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const quickLinks = [
    { title: "Como criar uma turma?", href: "/ajuda/professor#gerenciar-turmas" },
    { title: "Como criar exercícios?", href: "/ajuda/professor#criar-exercicios" },
    { title: "Como fazer uma prova?", href: "/ajuda/aluno#provas" },
    { title: "Como ver minhas notas?", href: "/ajuda/aluno#perfil-progresso" },
    { title: "Esqueci minha senha", href: "/ajuda/faq#senha" },
  ];

  return (
    <>
      <Sidebar />
      <PageWrapper>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold">Central de Ajuda</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontre respostas, tutoriais e guias completos para usar o FlowEdu
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-12">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar ajuda... (ex: como criar exercício)"
                  className="pl-10 h-12 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Main Help Sections */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {helpSections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className={`w-16 h-16 ${section.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className={`h-8 w-8 ${section.color}`} />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription className="text-base">
                        {section.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Acessar Manual
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Quick Links */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                Links Rápidos
              </CardTitle>
              <CardDescription>
                Acesso rápido às dúvidas mais comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      {link.title}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Video Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  Tutoriais em Vídeo
                </CardTitle>
                <CardDescription>
                  Aprenda visualmente com nossos tutoriais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Em breve: vídeos tutoriais sobre as principais funcionalidades do sistema.
                </p>
                <Button variant="outline" disabled className="w-full">
                  Em Desenvolvimento
                </Button>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Precisa de Mais Ajuda?
                </CardTitle>
                <CardDescription>
                  Entre em contato com o suporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Não encontrou o que procurava? Nossa equipe está pronta para ajudar.
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Entrar em Contato
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText('ebersantana@flowedu.app');
                        toast.success('Email copiado para a área de transferência!');
                      }}
                      className="cursor-pointer"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Email
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <a 
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=ebersantana@flowedu.app&su=Suporte FlowEdu&body=Olá, preciso de ajuda com:"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir no Gmail
                      </a>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <a 
                        href="https://outlook.live.com/mail/0/deeplink/compose?to=ebersantana@flowedu.app&subject=Suporte FlowEdu&body=Olá, preciso de ajuda com:"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir no Outlook Web
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  📧 ebersantana@flowedu.app
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Requirements */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Requisitos do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Navegador</h4>
                  <p className="text-sm text-muted-foreground">
                    Google Chrome, Firefox, Edge ou Safari (versões atualizadas)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Internet</h4>
                  <p className="text-sm text-muted-foreground">
                    Conexão estável recomendada
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Dispositivo</h4>
                  <p className="text-sm text-muted-foreground">
                    Computador, tablet ou smartphone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
