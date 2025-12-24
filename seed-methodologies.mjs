import { drizzle } from "drizzle-orm/mysql2";
import { activeMethodologies } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const methodologies = [
  {
    name: "Kahoot",
    description: "Plataforma de quiz gamificado que transforma avaliações em jogos interativos. Perfeito para revisão de conteúdo e engajamento dos alunos.",
    category: "Quiz e Avaliação",
    url: "https://kahoot.com",
    tips: "Use para revisão pré-prova ou aquecimento de aula. Crie quizzes de 10-15 perguntas para manter o ritmo dinâmico.",
    logoUrl: "",
    isFavorite: false,
    userId: 1, // Ajustar para o ID do usuário admin
  },
  {
    name: "Mentimeter",
    description: "Ferramenta de enquetes e apresentações interativas em tempo real. Ideal para coletar opiniões e feedback instantâneo da turma.",
    category: "Colaboração",
    url: "https://www.mentimeter.com",
    tips: "Excelente para iniciar discussões polêmicas ou verificar conhecimento prévio. Use nuvem de palavras para brainstorming.",
    logoUrl: "",
    isFavorite: true,
    userId: 1,
  },
  {
    name: "Padlet",
    description: "Mural colaborativo digital onde alunos podem postar textos, imagens, vídeos e links. Perfeito para trabalhos em grupo e construção coletiva.",
    category: "Colaboração",
    url: "https://padlet.com",
    tips: "Crie murais temáticos por unidade. Peça aos alunos para compartilhar recursos encontrados ou resumos de leitura.",
    logoUrl: "",
    isFavorite: true,
    userId: 1,
  },
  {
    name: "Canva",
    description: "Plataforma de design gráfico intuitiva para criar apresentações, infográficos e materiais visuais profissionais.",
    category: "Apresentação",
    url: "https://www.canva.com",
    tips: "Ensine princípios de design visual. Peça apresentações criativas ao invés de PowerPoint tradicional.",
    logoUrl: "",
    isFavorite: false,
    userId: 1,
  },
  {
    name: "Quizizz",
    description: "Plataforma de avaliação formativa com quizzes gamificados. Permite lição de casa e relatórios detalhados de desempenho.",
    category: "Quiz e Avaliação",
    url: "https://quizizz.com",
    tips: "Configure como tarefa assíncrona. Use relatórios para identificar dificuldades individuais e ajustar ensino.",
    logoUrl: "",
    isFavorite: false,
    userId: 1,
  },
  {
    name: "Google Forms",
    description: "Ferramenta gratuita para criar formulários, questionários e pesquisas com análise automática de respostas.",
    category: "Formulários",
    url: "https://forms.google.com",
    tips: "Crie formulários de autoavaliação ou feedback de aula. Use validação de dados para garantir respostas completas.",
    logoUrl: "",
    isFavorite: false,
    userId: 1,
  },
  {
    name: "Jamboard",
    description: "Quadro branco digital colaborativo do Google. Perfeito para brainstorming, mapas mentais e trabalho em grupo remoto.",
    category: "Quadro Branco",
    url: "https://jamboard.google.com",
    tips: "Use frames diferentes para cada grupo. Excelente para organizar ideias visualmente em projetos.",
    logoUrl: "",
    isFavorite: false,
    userId: 1,
  },
  {
    name: "Edpuzzle",
    description: "Plataforma para criar vídeo-aulas interativas com perguntas incorporadas. Transforma vídeos do YouTube em conteúdo pedagógico.",
    category: "Vídeo e Áudio",
    url: "https://edpuzzle.com",
    tips: "Adicione perguntas em momentos-chave do vídeo. Use para sala de aula invertida ou reforço de conceitos.",
    logoUrl: "",
    isFavorite: false,
    userId: 1,
  },
];

async function seed() {
  try {
    console.log("🌱 Populando banco com metodologias ativas...");
    
    for (const methodology of methodologies) {
      await db.insert(activeMethodologies).values(methodology);
      console.log(`✅ ${methodology.name} adicionado`);
    }
    
    console.log("\n🎉 Banco populado com sucesso!");
    console.log(`📚 ${methodologies.length} metodologias ativas cadastradas`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao popular banco:", error);
    process.exit(1);
  }
}

seed();
