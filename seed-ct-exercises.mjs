import mysql from 'mysql2/promise';

const exercises = [
  // ==================== DECOMPOSIÇÃO ====================
  {
    title: "Organizar uma Festa de Aniversário",
    description: "Você precisa organizar uma festa de aniversário. Divida essa tarefa grande em partes menores e mais gerenciáveis. Liste pelo menos 4 etapas principais.",
    dimension: "decomposition",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Divida a organização de uma festa em etapas menores:"
    }),
    expectedAnswer: "Exemplos: 1) Definir data e local, 2) Fazer lista de convidados, 3) Comprar decorações e comida, 4) Preparar atividades/entretenimento",
    points: 10
  },
  {
    title: "Criar um Aplicativo de Lista de Tarefas",
    description: "Um desenvolvedor precisa criar um app de lista de tarefas. Quebre esse projeto em componentes menores que podem ser desenvolvidos separadamente.",
    dimension: "decomposition",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Divida o desenvolvimento do app em partes independentes:"
    }),
    expectedAnswer: "Exemplos: 1) Interface de usuário, 2) Sistema de armazenamento de dados, 3) Função de adicionar tarefa, 4) Função de marcar como concluída, 5) Sistema de notificações",
    points: 15
  },
  {
    title: "Resolver o Problema do Trânsito na Cidade",
    description: "Uma cidade enfrenta problemas de trânsito. Decomponha esse problema complexo em subproblemas específicos que podem ser analisados separadamente.",
    dimension: "decomposition",
    difficulty: "hard",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Identifique os subproblemas do trânsito urbano:"
    }),
    expectedAnswer: "Exemplos: 1) Excesso de veículos particulares, 2) Transporte público insuficiente, 3) Sincronização de semáforos, 4) Falta de ciclovias, 5) Horários de pico, 6) Estacionamento inadequado",
    points: 20
  },
  {
    title: "Preparar um Jantar Completo",
    description: "Você vai preparar um jantar com entrada, prato principal e sobremesa. Divida essa tarefa em etapas que podem ser executadas em paralelo ou sequencialmente.",
    dimension: "decomposition",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Quebre a preparação do jantar em etapas:"
    }),
    expectedAnswer: "Exemplos: 1) Fazer lista de ingredientes, 2) Ir ao mercado, 3) Preparar entrada, 4) Cozinhar prato principal, 5) Fazer sobremesa, 6) Arrumar mesa",
    points: 10
  },
  {
    title: "Limpar e Organizar uma Casa",
    description: "Uma casa grande precisa ser completamente limpa e organizada. Decomponha essa tarefa por cômodos e tipos de limpeza.",
    dimension: "decomposition",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Divida a limpeza da casa em partes gerenciáveis:"
    }),
    expectedAnswer: "Exemplos: 1) Sala (aspirar, tirar pó, organizar), 2) Cozinha (lavar louça, limpar fogão, geladeira), 3) Quartos (trocar roupa de cama, organizar armários), 4) Banheiros (sanitários, espelhos, piso)",
    points: 15
  },

  // ==================== RECONHECIMENTO DE PADRÕES ====================
  {
    title: "Sequência Numérica Simples",
    description: "Observe a sequência: 2, 4, 6, 8, 10, ___. Qual é o padrão? Qual é o próximo número?",
    dimension: "pattern_recognition",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Identifique o padrão e o próximo número:"
    }),
    expectedAnswer: "Padrão: números pares em ordem crescente (soma 2). Próximo número: 12",
    points: 10
  },
  {
    title: "Padrão em Comportamento de Compras",
    description: "Uma loja percebe que as vendas de sorvete aumentam sempre que a temperatura sobe acima de 25°C. Que padrão você identifica? Como isso pode ser útil?",
    dimension: "pattern_recognition",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Explique o padrão e sua aplicação prática:"
    }),
    expectedAnswer: "Padrão: correlação entre temperatura alta e venda de sorvetes. Aplicação: aumentar estoque em dias quentes, fazer promoções em previsões de calor",
    points: 15
  },
  {
    title: "Padrão em Senhas Fracas",
    description: "Um sistema de segurança identifica que 60% das senhas fracas seguem padrões como '123456', 'senha123', 'nome+ano'. Por que esses padrões são problemáticos?",
    dimension: "pattern_recognition",
    difficulty: "hard",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Explique os padrões e os riscos:"
    }),
    expectedAnswer: "Padrões: sequências simples, palavras comuns + números, informações pessoais. Riscos: fácil de adivinhar, ataques de dicionário, força bruta rápida. Hackers conhecem esses padrões.",
    points: 20
  },
  {
    title: "Dias da Semana e Trânsito",
    description: "Você nota que o trânsito está sempre pior às segundas e sextas-feiras. Que padrão você identifica? Qual a possível causa?",
    dimension: "pattern_recognition",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Identifique o padrão e explique a causa:"
    }),
    expectedAnswer: "Padrão: trânsito intenso no início e fim da semana. Causa: segunda (retorno do fim de semana), sexta (saída antecipada, viagens)",
    points: 10
  },
  {
    title: "Padrão em Erros de Código",
    description: "Um programador percebe que 80% dos bugs no seu código acontecem em funções com mais de 50 linhas. Que padrão isso revela? Como usar essa informação?",
    dimension: "pattern_recognition",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Explique o padrão e a solução:"
    }),
    expectedAnswer: "Padrão: funções longas têm mais bugs. Causa: complexidade, difícil de testar e entender. Solução: dividir funções grandes em funções menores e mais simples",
    points: 15
  },

  // ==================== ABSTRAÇÃO ====================
  {
    title: "Descrever um Carro",
    description: "Você precisa explicar o que é um carro para alguém que nunca viu um. Foque apenas nas características essenciais, ignorando detalhes como cor ou marca.",
    dimension: "abstraction",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Descreva um carro focando no essencial:"
    }),
    expectedAnswer: "Veículo com 4 rodas, motor, usado para transportar pessoas, tem volante para direção, pedais para controle, bancos para passageiros",
    points: 10
  },
  {
    title: "Criar um Mapa Mental de 'Animal'",
    description: "Crie uma abstração do conceito 'Animal'. Quais são as características essenciais que TODO animal possui, independente de ser cachorro, peixe ou pássaro?",
    dimension: "abstraction",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Liste as características essenciais de qualquer animal:"
    }),
    expectedAnswer: "Características essenciais: ser vivo, se alimenta, se reproduz, se move (de alguma forma), respira, tem células. Detalhes ignorados: número de patas, habitat, tamanho, cor",
    points: 15
  },
  {
    title: "Modelar Sistema de Biblioteca",
    description: "Você está criando um sistema para uma biblioteca. Abstraia o conceito de 'Item Emprestável'. O que livros, DVDs e revistas têm em comum que é relevante para empréstimo?",
    dimension: "abstraction",
    difficulty: "hard",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Identifique as propriedades essenciais de um item emprestável:"
    }),
    expectedAnswer: "Propriedades essenciais: código único, título, status (disponível/emprestado), data de devolução, usuário que emprestou. Ignorar: conteúdo específico, formato físico, gênero",
    points: 20
  },
  {
    title: "Simplificar Instruções de Uso",
    description: "Um manual de 50 páginas explica como usar um micro-ondas. Abstraia as informações essenciais em 3 passos simples.",
    dimension: "abstraction",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Simplifique o uso do micro-ondas em 3 passos:"
    }),
    expectedAnswer: "1) Colocar alimento dentro, 2) Definir tempo, 3) Apertar iniciar. Detalhes ignorados: potência exata, tipos de recipiente, limpeza, funções avançadas",
    points: 10
  },
  {
    title: "Conceito de Pagamento Online",
    description: "Abstraia o processo de pagamento online. Quais são as etapas essenciais, independente de ser cartão, PIX ou boleto?",
    dimension: "abstraction",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Identifique as etapas essenciais de qualquer pagamento online:"
    }),
    expectedAnswer: "Etapas essenciais: 1) Autenticar usuário, 2) Confirmar valor, 3) Processar pagamento, 4) Enviar confirmação. Ignorar: método específico, interface, banco usado",
    points: 15
  },

  // ==================== ALGORITMOS ====================
  {
    title: "Fazer um Sanduíche",
    description: "Escreva um algoritmo (sequência de passos) para fazer um sanduíche. Os passos devem estar em ordem lógica e ser claros.",
    dimension: "algorithms",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Escreva os passos em ordem para fazer um sanduíche:"
    }),
    expectedAnswer: "1) Pegar 2 fatias de pão, 2) Passar manteiga/maionese, 3) Colocar recheio (queijo, presunto, etc), 4) Colocar a segunda fatia por cima, 5) Cortar ao meio (opcional)",
    points: 10
  },
  {
    title: "Trocar uma Lâmpada com Segurança",
    description: "Crie um algoritmo para trocar uma lâmpada queimada. Inclua passos de segurança e a ordem correta das ações.",
    dimension: "algorithms",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Escreva o algoritmo completo para trocar uma lâmpada:"
    }),
    expectedAnswer: "1) Desligar o interruptor, 2) Esperar lâmpada esfriar, 3) Posicionar escada/banco com segurança, 4) Girar lâmpada velha no sentido anti-horário, 5) Remover lâmpada queimada, 6) Rosquear lâmpada nova no sentido horário, 7) Ligar interruptor para testar",
    points: 15
  },
  {
    title: "Algoritmo de Busca em Lista Telefônica",
    description: "Explique o algoritmo mais eficiente para encontrar um nome em uma lista telefônica (ordenada alfabeticamente). Por que esse método é melhor que verificar página por página?",
    dimension: "algorithms",
    difficulty: "hard",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Descreva o algoritmo e explique sua eficiência:"
    }),
    expectedAnswer: "Busca binária: 1) Abrir no meio, 2) Verificar se o nome está antes ou depois, 3) Descartar metade, 4) Repetir até encontrar. Eficiente porque elimina metade das opções a cada passo (log n vs n)",
    points: 20
  },
  {
    title: "Atravessar a Rua com Segurança",
    description: "Escreva um algoritmo para atravessar a rua na faixa de pedestres. Inclua condições (SE... ENTÃO...).",
    dimension: "algorithms",
    difficulty: "easy",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Escreva o algoritmo com condições:"
    }),
    expectedAnswer: "1) Ir até a faixa de pedestres, 2) Olhar para os dois lados, 3) SE semáforo vermelho para carros ENTÃO atravessar, 4) SENÃO esperar, 5) Enquanto atravessa, continuar atento aos carros",
    points: 10
  },
  {
    title: "Ordenar Cartas por Valor",
    description: "Você tem 10 cartas de baralho embaralhadas. Descreva um algoritmo passo a passo para ordená-las do menor (Ás) ao maior (Rei).",
    dimension: "algorithms",
    difficulty: "medium",
    content: JSON.stringify({
      type: "open_text",
      prompt: "Descreva o algoritmo de ordenação:"
    }),
    expectedAnswer: "Exemplo (Insertion Sort): 1) Pegar primeira carta, 2) Para cada carta seguinte: comparar com as anteriores, 3) Inserir na posição correta, 4) Repetir até todas estarem ordenadas. Ou: encontrar a menor, colocar no início, repetir",
    points: 15
  },
];

async function seedExercises() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🌱 Inserindo exercícios de Pensamento Computacional...\n');
  
  // Buscar ID do primeiro admin (criador dos exercícios)
  const [admins] = await connection.execute(
    'SELECT id FROM users WHERE role = ? LIMIT 1',
    ['admin']
  );
  
  const createdBy = admins[0]?.id || 1;
  
  for (const exercise of exercises) {
    try {
      await connection.execute(
        `INSERT INTO ct_exercises (title, description, dimension, difficulty, content, expectedAnswer, points, createdBy, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [
          exercise.title,
          exercise.description,
          exercise.dimension,
          exercise.difficulty,
          exercise.content,
          exercise.expectedAnswer,
          exercise.points,
          createdBy
        ]
      );
      console.log(`✅ ${exercise.title} (${exercise.dimension} - ${exercise.difficulty})`);
    } catch (error) {
      console.error(`❌ Erro ao inserir "${exercise.title}":`, error.message);
    }
  }
  
  console.log(`\n✨ Total: ${exercises.length} exercícios inseridos!`);
  
  await connection.end();
}

seedExercises().catch(console.error);
