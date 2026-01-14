import PDFDocument from 'pdfkit';

interface ReportData {
  totalStudents: number;
  activeStudents: number;
  averagePoints: number;
  totalBadgesEarned: number;
  totalBadgesAvailable: number;
  beltDistribution: Array<{
    name: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  ranking: Array<{
    studentName: string;
    totalPoints: number;
    currentBelt: string;
    streakDays: number;
  }>;
  badges: Array<{
    name: string;
    description: string;
    earnedCount: number;
    percentage: number;
  }>;
  evolutionData: Array<{
    week: string;
    totalPoints: number;
  }>;
}

const BELT_LABELS: Record<string, string> = {
  white: 'Branca',
  yellow: 'Amarela',
  orange: 'Laranja',
  green: 'Verde',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
};

export function generateGamificationReport(data: ReportData) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Cabeçalho
  doc.fontSize(24).font('Helvetica-Bold').text('Relatório de Gamificação', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
  doc.moveDown(2);

  // Estatísticas Gerais
  doc.fontSize(16).font('Helvetica-Bold').text('📊 Estatísticas Gerais', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text(`Total de Alunos: ${data.totalStudents}`);
  doc.text(`Alunos Ativos (com streak): ${data.activeStudents}`);
  doc.text(`Pontos Médios por Aluno: ${data.averagePoints}`);
  doc.text(`Badges Conquistados: ${data.totalBadgesEarned} de ${data.totalBadgesAvailable} disponíveis`);
  doc.moveDown(2);

  // Distribuição de Faixas
  doc.fontSize(16).font('Helvetica-Bold').text('🥋 Distribuição de Faixas', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  
  // Tabela de faixas
  const tableTop = doc.y;
  const col1X = 50;
  const col2X = 250;
  const col3X = 400;
  
  doc.font('Helvetica-Bold');
  doc.text('Faixa', col1X, tableTop);
  doc.text('Alunos', col2X, tableTop);
  doc.text('Porcentagem', col3X, tableTop);
  doc.moveDown(0.5);
  
  doc.font('Helvetica');
  data.beltDistribution.forEach((belt) => {
    doc.text(`Faixa ${belt.label}`, col1X, doc.y);
    doc.text(belt.count.toString(), col2X, doc.y);
    doc.text(`${belt.percentage.toFixed(1)}%`, col3X, doc.y);
    doc.moveDown(0.3);
  });
  
  doc.moveDown(1.5);

  // Evolução Temporal
  if (data.evolutionData && data.evolutionData.length > 0) {
    doc.fontSize(16).font('Helvetica-Bold').text('📈 Evolução de Pontos (Últimas 4 Semanas)', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    
    data.evolutionData.forEach((week) => {
      doc.text(`${week.week}: ${week.totalPoints} pontos`);
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1.5);
  }

  // Nova página para ranking
  doc.addPage();
  
  // Ranking
  doc.fontSize(16).font('Helvetica-Bold').text('🏆 Ranking Geral da Turma (Top 20)', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');
  
  // Cabeçalho da tabela de ranking
  const rankTableTop = doc.y;
  const rankCol1X = 50;
  const rankCol2X = 100;
  const rankCol3X = 300;
  const rankCol4X = 400;
  const rankCol5X = 480;
  
  doc.font('Helvetica-Bold');
  doc.text('#', rankCol1X, rankTableTop);
  doc.text('Nome', rankCol2X, rankTableTop);
  doc.text('Pontos', rankCol3X, rankTableTop);
  doc.text('Faixa', rankCol4X, rankTableTop);
  doc.text('Streak', rankCol5X, rankTableTop);
  doc.moveDown(0.5);
  
  doc.font('Helvetica');
  data.ranking.slice(0, 20).forEach((student, index) => {
    const position = index + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
    
    doc.text(`${position} ${medal}`, rankCol1X, doc.y);
    doc.text(student.studentName.substring(0, 25), rankCol2X, doc.y);
    doc.text(student.totalPoints.toString(), rankCol3X, doc.y);
    doc.text(BELT_LABELS[student.currentBelt] || student.currentBelt, rankCol4X, doc.y);
    doc.text(`${student.streakDays}d`, rankCol5X, doc.y);
    doc.moveDown(0.4);
    
    // Nova página se necessário
    if (doc.y > 700) {
      doc.addPage();
      doc.fontSize(10).font('Helvetica');
    }
  });

  // Nova página para badges
  doc.addPage();
  
  // Badges Mais Conquistados
  doc.fontSize(16).font('Helvetica-Bold').text('🏅 Badges Mais Conquistados', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  
  // Tabela de badges
  const badgeTableTop = doc.y;
  const badgeCol1X = 50;
  const badgeCol2X = 200;
  const badgeCol3X = 400;
  const badgeCol4X = 480;
  
  doc.font('Helvetica-Bold');
  doc.text('Badge', badgeCol1X, badgeTableTop);
  doc.text('Descrição', badgeCol2X, badgeTableTop);
  doc.text('Conquistado', badgeCol3X, badgeTableTop);
  doc.text('%', badgeCol4X, badgeTableTop);
  doc.moveDown(0.5);
  
  doc.font('Helvetica');
  data.badges.forEach((badge) => {
    doc.text(badge.name.substring(0, 20), badgeCol1X, doc.y);
    doc.text(badge.description.substring(0, 30), badgeCol2X, doc.y);
    doc.text(badge.earnedCount.toString(), badgeCol3X, doc.y);
    doc.text(`${badge.percentage.toFixed(0)}%`, badgeCol4X, doc.y);
    doc.moveDown(0.4);
  });

  // Rodapé
  doc.fontSize(8).font('Helvetica').text(
    'FlowEdu - Relatório gerado automaticamente',
    50,
    doc.page.height - 50,
    { align: 'center' }
  );

  doc.end();
  return doc;
}
