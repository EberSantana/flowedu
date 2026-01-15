import mysql from 'mysql2/promise';

// Buscar a URL do banco de dados do ambiente
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

// Parse da URL do banco de dados
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1).split('?')[0],
  ssl: { rejectUnauthorized: true }
};

async function createLearningPath() {
  const connection = await mysql.createConnection(config);
  
  try {
    // 1. Buscar ID da disciplina Segurança da Informação
    const [subjects] = await connection.execute(
      "SELECT id, userId FROM subjects WHERE code = 'SEC01' LIMIT 1"
    );
    
    if (subjects.length === 0) {
      console.error('Disciplina SEC01 não encontrada');
      return;
    }
    
    const subjectId = subjects[0].id;
    const userId = subjects[0].userId;
    console.log(`Disciplina encontrada: ID ${subjectId}, Professor ID ${userId}`);
    
    // 2. Verificar se já existem módulos para esta disciplina
    const [existingModules] = await connection.execute(
      "SELECT COUNT(*) as count FROM learning_modules WHERE subjectId = ?",
      [subjectId]
    );
    
    if (existingModules[0].count > 0) {
      console.log('Módulos já existem para esta disciplina. Pulando criação.');
      return;
    }
    
    // 3. Criar módulos da trilha de Segurança da Informação
    const modules = [
      {
        title: "Fundamentos de Segurança da Informação",
        description: "Conceitos básicos, pilares da segurança (CIA), ameaças e vulnerabilidades",
        orderIndex: 1,
        topics: [
          { title: "Introdução à Segurança da Informação", description: "O que é segurança da informação e sua importância no mundo digital", estimatedHours: 2 },
          { title: "Pilares da Segurança: Confidencialidade, Integridade e Disponibilidade", description: "Os três pilares fundamentais (CIA Triad) e como aplicá-los", estimatedHours: 3 },
          { title: "Tipos de Ameaças e Vulnerabilidades", description: "Malware, phishing, engenharia social, vulnerabilidades de software", estimatedHours: 4 },
          { title: "Gestão de Riscos em Segurança", description: "Identificação, análise e tratamento de riscos de segurança", estimatedHours: 3 }
        ]
      },
      {
        title: "Criptografia e Proteção de Dados",
        description: "Técnicas de criptografia, certificados digitais e proteção de dados sensíveis",
        orderIndex: 2,
        topics: [
          { title: "Fundamentos de Criptografia", description: "Criptografia simétrica vs assimétrica, algoritmos comuns", estimatedHours: 4 },
          { title: "Certificados Digitais e PKI", description: "Infraestrutura de chaves públicas, certificados SSL/TLS", estimatedHours: 3 },
          { title: "Hash e Assinaturas Digitais", description: "Funções hash, integridade de dados, assinaturas digitais", estimatedHours: 3 },
          { title: "Proteção de Dados Sensíveis (LGPD)", description: "Lei Geral de Proteção de Dados e boas práticas", estimatedHours: 4 }
        ]
      },
      {
        title: "Segurança de Redes",
        description: "Firewalls, VPNs, detecção de intrusão e segurança em redes corporativas",
        orderIndex: 3,
        topics: [
          { title: "Arquitetura de Redes Seguras", description: "DMZ, segmentação de rede, defesa em profundidade", estimatedHours: 4 },
          { title: "Firewalls e Sistemas de Detecção de Intrusão", description: "Configuração de firewalls, IDS/IPS, monitoramento", estimatedHours: 5 },
          { title: "VPNs e Acesso Remoto Seguro", description: "Tipos de VPN, configuração segura de acesso remoto", estimatedHours: 3 },
          { title: "Segurança em Redes Wireless", description: "WPA3, ataques a redes Wi-Fi, boas práticas", estimatedHours: 3 }
        ]
      },
      {
        title: "Segurança em Aplicações Web",
        description: "OWASP Top 10, testes de penetração, desenvolvimento seguro",
        orderIndex: 4,
        topics: [
          { title: "OWASP Top 10 Vulnerabilidades", description: "As 10 vulnerabilidades mais críticas em aplicações web", estimatedHours: 5 },
          { title: "Injeção SQL e XSS", description: "Ataques de injeção, cross-site scripting, prevenção", estimatedHours: 4 },
          { title: "Autenticação e Gerenciamento de Sessões", description: "OAuth, JWT, sessões seguras, MFA", estimatedHours: 4 },
          { title: "Desenvolvimento Seguro (SSDLC)", description: "Ciclo de vida de desenvolvimento seguro, code review", estimatedHours: 4 }
        ]
      },
      {
        title: "Resposta a Incidentes e Forense Digital",
        description: "Planos de resposta a incidentes, análise forense, recuperação de desastres",
        orderIndex: 5,
        topics: [
          { title: "Plano de Resposta a Incidentes", description: "Criação e implementação de planos de resposta", estimatedHours: 4 },
          { title: "Análise Forense Digital", description: "Coleta de evidências, cadeia de custódia, ferramentas forenses", estimatedHours: 5 },
          { title: "Recuperação de Desastres e Continuidade de Negócios", description: "BCP, DRP, backup e recuperação", estimatedHours: 4 },
          { title: "Compliance e Auditoria de Segurança", description: "ISO 27001, SOC 2, auditorias de segurança", estimatedHours: 4 }
        ]
      }
    ];
    
    // 4. Inserir módulos e tópicos
    for (const module of modules) {
      // Inserir módulo
      const [moduleResult] = await connection.execute(
        `INSERT INTO learning_modules (subjectId, title, description, orderIndex, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [subjectId, module.title, module.description, module.orderIndex]
      );
      
      const moduleId = moduleResult.insertId;
      console.log(`Módulo criado: ${module.title} (ID: ${moduleId})`);
      
      // Inserir tópicos do módulo
      let topicOrder = 1;
      for (const topic of module.topics) {
        await connection.execute(
          `INSERT INTO learning_topics (moduleId, title, description, status, estimatedHours, orderIndex, createdAt, updatedAt) 
           VALUES (?, ?, ?, 'not_started', ?, ?, NOW(), NOW())`,
          [moduleId, topic.title, topic.description, topic.estimatedHours, topicOrder]
        );
        console.log(`  - Tópico criado: ${topic.title}`);
        topicOrder++;
      }
    }
    
    console.log('\n✅ Trilha de Aprendizagem de Segurança da Informação criada com sucesso!');
    console.log(`Total: ${modules.length} módulos e ${modules.reduce((acc, m) => acc + m.topics.length, 0)} tópicos`);
    
  } catch (error) {
    console.error('Erro ao criar trilha:', error);
  } finally {
    await connection.end();
  }
}

createLearningPath();
