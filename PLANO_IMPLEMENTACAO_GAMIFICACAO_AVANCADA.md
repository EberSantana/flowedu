# Plano de Implementação: Gamificação Avançada

**Data:** Janeiro de 2025  
**Status:** Em Planejamento  
**Prioridade:** Alta

---

## 📋 Visão Geral

Este documento detalha a implementação prática das novas funcionalidades de gamificação avançada na plataforma de gestão educacional. O plano está dividido em fases incrementais que podem ser implementadas de forma independente.

---

## 🗄️ FASE 1: Estrutura de Banco de Dados

### 1.1 Sistema de Especialização por Trilhas

```sql
-- Tabela de trilhas técnicas (Web, Segurança, Dados, DevOps, etc)
CREATE TABLE specialization_tracks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#3b82f6',
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de níveis dentro de cada trilha
CREATE TABLE track_levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  track_id INT NOT NULL,
  level_name VARCHAR(50) NOT NULL, -- 'Iniciante', 'Intermediário', 'Avançado'
  level_order INT NOT NULL,
  required_exercises INT DEFAULT 0,
  required_projects INT DEFAULT 0,
  required_points INT DEFAULT 0,
  badge_image VARCHAR(255),
  certificate_template VARCHAR(255),
  FOREIGN KEY (track_id) REFERENCES specialization_tracks(id) ON DELETE CASCADE
);

-- Progresso do aluno em cada trilha
CREATE TABLE student_track_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  track_id INT NOT NULL,
  current_level_id INT,
  exercises_completed INT DEFAULT 0,
  projects_completed INT DEFAULT 0,
  total_points INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES specialization_tracks(id) ON DELETE CASCADE,
  FOREIGN KEY (current_level_id) REFERENCES track_levels(id),
  UNIQUE KEY unique_student_track (student_id, track_id)
);
```

### 1.2 Sistema de Tech Coins (Economia Virtual)

```sql
-- Carteira de moedas do aluno
CREATE TABLE student_wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  tech_coins INT DEFAULT 0,
  total_earned INT DEFAULT 0, -- Total histórico ganho
  total_spent INT DEFAULT 0,  -- Total histórico gasto
  last_transaction_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Histórico de transações de moedas
CREATE TABLE coin_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  amount INT NOT NULL, -- Positivo = ganhou, Negativo = gastou
  transaction_type ENUM('earn', 'spend', 'bonus', 'penalty') NOT NULL,
  source VARCHAR(100), -- 'exercise_completion', 'daily_streak', 'shop_purchase', etc
  description TEXT,
  metadata JSON, -- Dados adicionais (exercise_id, item_id, etc)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_student_date (student_id, created_at)
);

-- Loja de itens (avatares, power-ups, etc)
CREATE TABLE shop_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  item_type ENUM('avatar_kimono', 'avatar_accessory', 'avatar_background', 'power_up', 'certificate', 'unlock') NOT NULL,
  price INT NOT NULL,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  image_url VARCHAR(255),
  metadata JSON, -- Configurações específicas do item
  required_belt VARCHAR(20), -- Faixa mínima necessária
  required_points INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  stock INT DEFAULT -1, -- -1 = ilimitado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Itens comprados pelos alunos
CREATE TABLE student_purchased_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  item_id INT NOT NULL,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_equipped BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE,
  INDEX idx_student_items (student_id, is_equipped)
);
```

### 1.3 Desafios Semanais CTF

```sql
-- Desafios semanais
CREATE TABLE weekly_challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_number INT NOT NULL, -- Semana do ano (1-52)
  year INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  challenge_type ENUM('individual_easy', 'individual_medium', 'individual_hard', 'team_project') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  points_reward INT NOT NULL,
  tech_coins_reward INT DEFAULT 0,
  subject_id INT, -- Disciplina relacionada
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL, -- Professor que criou
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_week_year (week_number, year)
);

-- Submissões dos alunos aos desafios
CREATE TABLE challenge_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  student_id INT NOT NULL,
  team_id INT, -- NULL se individual
  submission_url VARCHAR(500), -- Link para GitHub, etc
  submission_text TEXT,
  submission_files JSON, -- Array de URLs de arquivos
  score INT DEFAULT 0,
  is_correct BOOLEAN DEFAULT FALSE,
  feedback TEXT,
  reviewed_by INT, -- Professor que revisou
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_challenge_student (challenge_id, student_id)
);

-- Equipes para desafios colaborativos
CREATE TABLE challenge_teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id) ON DELETE CASCADE
);

-- Membros das equipes
CREATE TABLE team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  student_id INT NOT NULL,
  role ENUM('leader', 'member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES challenge_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_student (team_id, student_id)
);
```

### 1.4 Boss Battles (Avaliações Épicas)

```sql
-- Boss Battles (avaliações especiais)
CREATE TABLE boss_battles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  narrative TEXT, -- História/contexto do "boss"
  boss_image VARCHAR(255),
  phase_1_weight DECIMAL(3,2) DEFAULT 0.20, -- Reconhecimento
  phase_2_weight DECIMAL(3,2) DEFAULT 0.60, -- Combate
  phase_3_weight DECIMAL(3,2) DEFAULT 0.20, -- Vitória
  max_attempts INT DEFAULT 3,
  time_limit_minutes INT,
  points_s_rank INT DEFAULT 200, -- 95-100%
  points_a_rank INT DEFAULT 100, -- 85-94%
  points_b_rank INT DEFAULT 50,  -- 70-84%
  points_participation INT DEFAULT 25,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tentativas dos alunos em Boss Battles
CREATE TABLE boss_battle_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  battle_id INT NOT NULL,
  student_id INT NOT NULL,
  attempt_number INT NOT NULL,
  phase_1_score DECIMAL(5,2) DEFAULT 0,
  phase_2_score DECIMAL(5,2) DEFAULT 0,
  phase_3_score DECIMAL(5,2) DEFAULT 0,
  final_score DECIMAL(5,2) DEFAULT 0,
  rank VARCHAR(2), -- 'S', 'A', 'B', 'C'
  lives_remaining INT DEFAULT 3,
  power_ups_used JSON,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (battle_id) REFERENCES boss_battles(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_battle_student (battle_id, student_id)
);
```

### 1.5 Mentoria Gamificada

```sql
-- Sistema de mentoria
CREATE TABLE mentorship_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  approved_by INT, -- Professor que aprovou
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  motivation TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Atividades de mentoria
CREATE TABLE mentorship_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mentor_id INT NOT NULL,
  mentee_id INT, -- NULL se for tutorial geral
  activity_type ENUM('forum_answer', 'code_review', 'tutorial', 'study_session') NOT NULL,
  title VARCHAR(200),
  description TEXT,
  url VARCHAR(500), -- Link para fórum, tutorial, etc
  points_earned INT DEFAULT 0,
  tech_coins_earned INT DEFAULT 0,
  rating DECIMAL(2,1), -- Avaliação 0-5
  reviewed_by INT, -- Professor que validou
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (mentor_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (mentee_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Estatísticas de mentores
CREATE TABLE mentor_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  total_helps INT DEFAULT 0,
  total_tutorials INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  mentor_level ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

### 1.6 Conquistas Ocultas (Easter Eggs)

```sql
-- Conquistas ocultas (adicionais aos badges existentes)
CREATE TABLE hidden_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code_name VARCHAR(100) NOT NULL UNIQUE, -- 'arqueologist', 'debugger_nato', etc
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  unlock_message TEXT,
  icon VARCHAR(255),
  points_reward INT DEFAULT 0,
  tech_coins_reward INT DEFAULT 0,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'rare',
  unlock_condition JSON, -- Condições programáticas para desbloquear
  is_secret BOOLEAN DEFAULT TRUE, -- Se TRUE, não aparece até ser desbloqueado
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conquistas desbloqueadas pelos alunos
CREATE TABLE student_hidden_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  achievement_id INT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES hidden_achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_achievement (student_id, achievement_id)
);
```

### 1.7 Modo Hardcore

```sql
-- Configurações de modo hardcore por exercício
CREATE TABLE hardcore_mode_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exercise_id INT NOT NULL,
  mode_type ENUM('time_attack', 'no_hints', 'one_shot', 'code_golf', 'retro_challenge') NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL, -- 1.5x, 2x, 3x, etc
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (exercise_id) REFERENCES student_exercises(id) ON DELETE CASCADE,
  UNIQUE KEY unique_exercise_mode (exercise_id, mode_type)
);

-- Tentativas em modo hardcore
CREATE TABLE hardcore_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  exercise_id INT NOT NULL,
  mode_type ENUM('time_attack', 'no_hints', 'one_shot', 'code_golf', 'retro_challenge') NOT NULL,
  base_score INT NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL,
  final_score INT NOT NULL,
  completion_time INT, -- Segundos
  lines_of_code INT, -- Para code_golf
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES student_exercises(id) ON DELETE CASCADE,
  INDEX idx_student_exercise (student_id, exercise_id)
);
```

### 1.8 Sistema de Temporadas

```sql
-- Temporadas (Seasons)
CREATE TABLE game_seasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season_number INT NOT NULL,
  year INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  theme VARCHAR(100), -- 'Fundamentos', 'Web Revolution', etc
  description TEXT,
  focus_area VARCHAR(100), -- 'Lógica + Algoritmos', 'Front-end + Back-end', etc
  banner_image VARCHAR(255),
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_season_year (season_number, year)
);

-- Recompensas exclusivas da temporada
CREATE TABLE season_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season_id INT NOT NULL,
  reward_type ENUM('badge', 'kimono', 'avatar_item', 'certificate') NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(255),
  required_points INT DEFAULT 0,
  required_rank INT, -- Posição no ranking necessária
  is_exclusive BOOLEAN DEFAULT TRUE, -- Se TRUE, só disponível nesta season
  FOREIGN KEY (season_id) REFERENCES game_seasons(id) ON DELETE CASCADE
);

-- Progresso dos alunos na temporada
CREATE TABLE student_season_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  season_id INT NOT NULL,
  season_points INT DEFAULT 0,
  season_rank INT,
  challenges_completed INT DEFAULT 0,
  rewards_claimed JSON, -- Array de reward_ids
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES game_seasons(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_season (student_id, season_id)
);

-- Eventos especiais
CREATE TABLE special_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('hackathon', 'code_week', 'bug_hunt', 'workshop', 'competition') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  rules TEXT,
  prize_description TEXT,
  points_reward INT DEFAULT 0,
  tech_coins_reward INT DEFAULT 0,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  max_participants INT, -- NULL = ilimitado
  registration_deadline TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Inscrições em eventos
CREATE TABLE event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  team_id INT, -- NULL se individual
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  participation_status ENUM('registered', 'participated', 'completed', 'no_show') DEFAULT 'registered',
  final_score INT,
  rank_position INT,
  FOREIGN KEY (event_id) REFERENCES special_events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_student (event_id, student_id)
);
```

---

## 🔧 FASE 2: Implementação Backend (server/db.ts)

### 2.1 Funções para Sistema de Especialização

```typescript
// ===== SPECIALIZATION TRACKS =====

export async function getAllSpecializationTracks() {
  return db.select().from(specializationTracks).where(eq(specializationTracks.isActive, true)).orderBy(specializationTracks.orderIndex);
}

export async function getTrackLevels(trackId: number) {
  return db.select().from(trackLevels).where(eq(trackLevels.trackId, trackId)).orderBy(trackLevels.levelOrder);
}

export async function getStudentTrackProgress(studentId: number) {
  return db.select({
    track: specializationTracks,
    progress: studentTrackProgress,
    currentLevel: trackLevels
  })
  .from(studentTrackProgress)
  .leftJoin(specializationTracks, eq(studentTrackProgress.trackId, specializationTracks.id))
  .leftJoin(trackLevels, eq(studentTrackProgress.currentLevelId, trackLevels.id))
  .where(eq(studentTrackProgress.studentId, studentId));
}

export async function startTrack(studentId: number, trackId: number) {
  const firstLevel = await db.select().from(trackLevels)
    .where(eq(trackLevels.trackId, trackId))
    .orderBy(trackLevels.levelOrder)
    .limit(1);
  
  return db.insert(studentTrackProgress).values({
    studentId,
    trackId,
    currentLevelId: firstLevel[0]?.id,
    exercisesCompleted: 0,
    projectsCompleted: 0,
    totalPoints: 0
  });
}

export async function updateTrackProgress(studentId: number, trackId: number, data: {
  exercisesCompleted?: number;
  projectsCompleted?: number;
  totalPoints?: number;
}) {
  const progress = await db.select().from(studentTrackProgress)
    .where(and(
      eq(studentTrackProgress.studentId, studentId),
      eq(studentTrackProgress.trackId, trackId)
    ))
    .limit(1);
  
  if (!progress[0]) return null;
  
  // Verificar se deve subir de nível
  const currentLevel = await db.select().from(trackLevels)
    .where(eq(trackLevels.id, progress[0].currentLevelId!))
    .limit(1);
  
  const newExercises = data.exercisesCompleted ?? progress[0].exercisesCompleted;
  const newProjects = data.projectsCompleted ?? progress[0].projectsCompleted;
  const newPoints = data.totalPoints ?? progress[0].totalPoints;
  
  let newLevelId = progress[0].currentLevelId;
  
  if (currentLevel[0]) {
    if (newExercises >= currentLevel[0].requiredExercises &&
        newProjects >= currentLevel[0].requiredProjects &&
        newPoints >= currentLevel[0].requiredPoints) {
      // Buscar próximo nível
      const nextLevel = await db.select().from(trackLevels)
        .where(and(
          eq(trackLevels.trackId, trackId),
          gt(trackLevels.levelOrder, currentLevel[0].levelOrder)
        ))
        .orderBy(trackLevels.levelOrder)
        .limit(1);
      
      if (nextLevel[0]) {
        newLevelId = nextLevel[0].id;
      }
    }
  }
  
  return db.update(studentTrackProgress)
    .set({
      ...data,
      currentLevelId: newLevelId
    })
    .where(and(
      eq(studentTrackProgress.studentId, studentId),
      eq(studentTrackProgress.trackId, trackId)
    ));
}
```

### 2.2 Funções para Tech Coins

```typescript
// ===== TECH COINS =====

export async function getStudentWallet(studentId: number) {
  let wallet = await db.select().from(studentWallets)
    .where(eq(studentWallets.studentId, studentId))
    .limit(1);
  
  if (!wallet[0]) {
    await db.insert(studentWallets).values({ studentId, techCoins: 0 });
    wallet = await db.select().from(studentWallets)
      .where(eq(studentWallets.studentId, studentId))
      .limit(1);
  }
  
  return wallet[0];
}

export async function addTechCoins(studentId: number, amount: number, source: string, description: string, metadata?: any) {
  const wallet = await getStudentWallet(studentId);
  
  // Criar transação
  await db.insert(coinTransactions).values({
    studentId,
    amount,
    transactionType: 'earn',
    source,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null
  });
  
  // Atualizar carteira
  return db.update(studentWallets)
    .set({
      techCoins: wallet.techCoins + amount,
      totalEarned: wallet.totalEarned + amount,
      lastTransactionAt: new Date()
    })
    .where(eq(studentWallets.studentId, studentId));
}

export async function spendTechCoins(studentId: number, amount: number, itemId: number, description: string) {
  const wallet = await getStudentWallet(studentId);
  
  if (wallet.techCoins < amount) {
    throw new Error('Insufficient tech coins');
  }
  
  // Criar transação
  await db.insert(coinTransactions).values({
    studentId,
    amount: -amount,
    transactionType: 'spend',
    source: 'shop_purchase',
    description,
    metadata: JSON.stringify({ itemId })
  });
  
  // Atualizar carteira
  await db.update(studentWallets)
    .set({
      techCoins: wallet.techCoins - amount,
      totalSpent: wallet.totalSpent + amount,
      lastTransactionAt: new Date()
    })
    .where(eq(studentWallets.studentId, studentId));
  
  // Registrar compra
  return db.insert(studentPurchasedItems).values({
    studentId,
    itemId
  });
}

export async function getShopItems(filters?: { itemType?: string; maxPrice?: number; requiredBelt?: string }) {
  let query = db.select().from(shopItems).where(eq(shopItems.isAvailable, true));
  
  // Aplicar filtros se necessário
  
  return query;
}

export async function getStudentPurchasedItems(studentId: number) {
  return db.select({
    purchase: studentPurchasedItems,
    item: shopItems
  })
  .from(studentPurchasedItems)
  .leftJoin(shopItems, eq(studentPurchasedItems.itemId, shopItems.id))
  .where(eq(studentPurchasedItems.studentId, studentId));
}

export async function equipItem(studentId: number, itemId: number) {
  // Desequipar outros itens do mesmo tipo
  const item = await db.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
  
  if (item[0]) {
    await db.update(studentPurchasedItems)
      .set({ isEquipped: false })
      .where(and(
        eq(studentPurchasedItems.studentId, studentId),
        eq(shopItems.itemType, item[0].itemType)
      ));
  }
  
  // Equipar item selecionado
  return db.update(studentPurchasedItems)
    .set({ isEquipped: true })
    .where(and(
      eq(studentPurchasedItems.studentId, studentId),
      eq(studentPurchasedItems.itemId, itemId)
    ));
}
```

### 2.3 Funções para Desafios Semanais CTF

```typescript
// ===== WEEKLY CHALLENGES =====

export async function getCurrentWeeklyChallenges() {
  const now = new Date();
  return db.select().from(weeklyChallenges)
    .where(and(
      eq(weeklyChallenges.isActive, true),
      lte(weeklyChallenges.startsAt, now),
      gte(weeklyChallenges.endsAt, now)
    ));
}

export async function submitChallenge(data: {
  challengeId: number;
  studentId: number;
  teamId?: number;
  submissionUrl?: string;
  submissionText?: string;
  submissionFiles?: string[];
}) {
  return db.insert(challengeSubmissions).values({
    ...data,
    submissionFiles: data.submissionFiles ? JSON.stringify(data.submissionFiles) : null
  });
}

export async function reviewChallengeSubmission(submissionId: number, reviewedBy: number, score: number, isCorrect: boolean, feedback: string) {
  const submission = await db.select().from(challengeSubmissions)
    .where(eq(challengeSubmissions.id, submissionId))
    .limit(1);
  
  if (!submission[0]) return null;
  
  await db.update(challengeSubmissions)
    .set({
      score,
      isCorrect,
      feedback,
      reviewedBy,
      reviewedAt: new Date()
    })
    .where(eq(challengeSubmissions.id, submissionId));
  
  // Se correto, dar recompensas
  if (isCorrect) {
    const challenge = await db.select().from(weeklyChallenges)
      .where(eq(weeklyChallenges.id, submission[0].challengeId))
      .limit(1);
    
    if (challenge[0]) {
      // Adicionar pontos
      await addSubjectPoints(
        submission[0].studentId,
        challenge[0].subjectId!,
        challenge[0].pointsReward,
        'weekly_challenge',
        `Desafio Semanal: ${challenge[0].title}`
      );
      
      // Adicionar tech coins
      if (challenge[0].techCoinsReward > 0) {
        await addTechCoins(
          submission[0].studentId,
          challenge[0].techCoinsReward,
          'weekly_challenge',
          `Desafio Semanal: ${challenge[0].title}`,
          { challengeId: challenge[0].id }
        );
      }
    }
  }
  
  return submission[0];
}

export async function createChallengeTeam(challengeId: number, teamName: string, leaderId: number) {
  const team = await db.insert(challengeTeams).values({
    challengeId,
    teamName
  });
  
  const teamId = team[0].insertId;
  
  await db.insert(teamMembers).values({
    teamId,
    studentId: leaderId,
    role: 'leader'
  });
  
  return teamId;
}

export async function joinChallengeTeam(teamId: number, studentId: number) {
  return db.insert(teamMembers).values({
    teamId,
    studentId,
    role: 'member'
  });
}

export async function getWeeklyChallengeLeaderboard(challengeId: number) {
  return db.select({
    student: students,
    submission: challengeSubmissions
  })
  .from(challengeSubmissions)
  .leftJoin(students, eq(challengeSubmissions.studentId, students.id))
  .where(and(
    eq(challengeSubmissions.challengeId, challengeId),
    eq(challengeSubmissions.isCorrect, true)
  ))
  .orderBy(desc(challengeSubmissions.score), asc(challengeSubmissions.submittedAt));
}
```

---

## 🎨 FASE 3: Rotas tRPC (server/routers.ts)

```typescript
// ===== SPECIALIZATION TRACKS =====
specializationTracks: t.router({
  getAll: publicProcedure.query(async () => {
    return await getAllSpecializationTracks();
  }),
  
  getMyProgress: studentProcedure.query(async ({ ctx }) => {
    return await getStudentTrackProgress(ctx.studentSession.studentId);
  }),
  
  startTrack: studentProcedure
    .input(z.object({ trackId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await startTrack(ctx.studentSession.studentId, input.trackId);
    }),
  
  // Professor cria nova trilha
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await db.insert(specializationTracks).values(input);
    })
}),

// ===== TECH COINS =====
techCoins: t.router({
  getMyWallet: studentProcedure.query(async ({ ctx }) => {
    return await getStudentWallet(ctx.studentSession.studentId);
  }),
  
  getTransactionHistory: studentProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return await db.select().from(coinTransactions)
        .where(eq(coinTransactions.studentId, ctx.studentSession.studentId))
        .orderBy(desc(coinTransactions.createdAt))
        .limit(input.limit);
    }),
  
  getShopItems: studentProcedure
    .input(z.object({
      itemType: z.string().optional(),
      maxPrice: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await getShopItems(input);
    }),
  
  purchaseItem: studentProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.select().from(shopItems)
        .where(eq(shopItems.id, input.itemId))
        .limit(1);
      
      if (!item[0]) throw new Error('Item not found');
      
      return await spendTechCoins(
        ctx.studentSession.studentId,
        item[0].price,
        input.itemId,
        `Compra: ${item[0].name}`
      );
    }),
  
  equipItem: studentProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await equipItem(ctx.studentSession.studentId, input.itemId);
    })
}),

// ===== WEEKLY CHALLENGES =====
weeklyChallenges: t.router({
  getCurrent: studentProcedure.query(async () => {
    return await getCurrentWeeklyChallenges();
  }),
  
  submit: studentProcedure
    .input(z.object({
      challengeId: z.number(),
      submissionUrl: z.string().optional(),
      submissionText: z.string().optional(),
      submissionFiles: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return await submitChallenge({
        ...input,
        studentId: ctx.studentSession.studentId
      });
    }),
  
  getLeaderboard: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ input }) => {
      return await getWeeklyChallengeLeaderboard(input.challengeId);
    }),
  
  // Professor cria desafio
  create: protectedProcedure
    .input(z.object({
      weekNumber: z.number(),
      year: z.number(),
      title: z.string(),
      description: z.string(),
      challengeType: z.enum(['individual_easy', 'individual_medium', 'individual_hard', 'team_project']),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      pointsReward: z.number(),
      techCoinsReward: z.number().optional(),
      subjectId: z.number().optional(),
      startsAt: z.date(),
      endsAt: z.date()
    }))
    .mutation(async ({ ctx, input }) => {
      return await db.insert(weeklyChallenges).values({
        ...input,
        createdBy: ctx.user.id
      });
    }),
  
  // Professor revisa submissão
  review: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      score: z.number(),
      isCorrect: z.boolean(),
      feedback: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      return await reviewChallengeSubmission(
        input.submissionId,
        ctx.user.id,
        input.score,
        input.isCorrect,
        input.feedback
      );
    })
})
```

---

## 📱 FASE 4: Interfaces do Aluno

### 4.1 Página de Especialização (StudentSpecializations.tsx)

```typescript
// client/src/pages/StudentSpecializations.tsx
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentSpecializations() {
  const { data: tracks, isLoading: tracksLoading } = trpc.specializationTracks.getAll.useQuery();
  const { data: myProgress, isLoading: progressLoading } = trpc.specializationTracks.getMyProgress.useQuery();
  const startTrackMutation = trpc.specializationTracks.startTrack.useMutation();
  
  const handleStartTrack = async (trackId: number) => {
    await startTrackMutation.mutateAsync({ trackId });
    // Refresh progress
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2">Especializações Técnicas</h1>
      <p className="text-gray-600 mb-8">Escolha sua trilha e torne-se um especialista!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks?.map((track) => {
          const progress = myProgress?.find(p => p.track?.id === track.id);
          const isStarted = !!progress;
          
          return (
            <Card key={track.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl`}
                     style={{ backgroundColor: track.color + '20' }}>
                  {track.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{track.name}</h3>
                  {isStarted && (
                    <Badge variant="outline">{progress.currentLevel?.levelName}</Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{track.description}</p>
              
              {isStarted ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span className="font-semibold">{progress.progress?.totalPoints} pts</span>
                    </div>
                    <Progress value={calculateProgress(progress)} />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold">{progress.progress?.exercisesCompleted}</div>
                      <div className="text-gray-500">Exercícios</div>
                    </div>
                    <div>
                      <div className="font-bold">{progress.progress?.projectsCompleted}</div>
                      <div className="text-gray-500">Projetos</div>
                    </div>
                    <div>
                      <div className="font-bold">{progress.progress?.totalPoints}</div>
                      <div className="text-gray-500">Pontos</div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">Ver Detalhes</Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleStartTrack(track.id)}
                  disabled={startTrackMutation.isPending}
                >
                  Iniciar Trilha
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.2 Loja de Tech Coins (StudentShop.tsx)

```typescript
// client/src/pages/StudentShop.tsx
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Lock, Check } from 'lucide-react';

export default function StudentShop() {
  const { data: wallet } = trpc.techCoins.getMyWallet.useQuery();
  const { data: items } = trpc.techCoins.getShopItems.useQuery({});
  const { data: purchased } = trpc.techCoins.getMyPurchasedItems.useQuery();
  const purchaseMutation = trpc.techCoins.purchaseItem.useMutation();
  
  const handlePurchase = async (itemId: number, price: number) => {
    if (!wallet || wallet.techCoins < price) {
      toast.error('Tech Coins insuficientes!');
      return;
    }
    
    await purchaseMutation.mutateAsync({ itemId });
    toast.success('Item comprado com sucesso!');
  };
  
  const isPurchased = (itemId: number) => {
    return purchased?.some(p => p.item?.id === itemId);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header com saldo */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Loja de Tech Coins</h1>
            <p className="text-yellow-100">Personalize seu avatar e desbloqueie vantagens!</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-4xl font-bold">
              <Coins className="w-10 h-10" />
              {wallet?.techCoins || 0}
            </div>
            <div className="text-sm text-yellow-100">Tech Coins disponíveis</div>
          </div>
        </div>
      </div>
      
      {/* Grid de itens */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items?.map((item) => {
          const owned = isPurchased(item.id);
          const canAfford = (wallet?.techCoins || 0) >= item.price;
          const isLocked = item.requiredPoints > 0; // Simplificado
          
          return (
            <Card key={item.id} className="p-4 relative">
              {/* Badge de raridade */}
              <Badge 
                className="absolute top-2 right-2"
                variant={item.rarity === 'legendary' ? 'default' : 'secondary'}
              >
                {item.rarity}
              </Badge>
              
              {/* Imagem do item */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-4xl">{item.itemType === 'avatar_kimono' ? '🥋' : '✨'}</div>
                )}
              </div>
              
              <h3 className="font-bold mb-1">{item.name}</h3>
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              
              {/* Preço e ação */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-bold text-orange-600">
                  <Coins className="w-4 h-4" />
                  {item.price}
                </div>
                
                {owned ? (
                  <Button size="sm" variant="outline" disabled>
                    <Check className="w-4 h-4 mr-1" />
                    Possui
                  </Button>
                ) : isLocked ? (
                  <Button size="sm" variant="outline" disabled>
                    <Lock className="w-4 h-4 mr-1" />
                    Bloqueado
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handlePurchase(item.id, item.price)}
                    disabled={!canAfford || purchaseMutation.isPending}
                  >
                    Comprar
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.3 Desafios Semanais (StudentWeeklyChallenges.tsx)

```typescript
// client/src/pages/StudentWeeklyChallenges.tsx
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Zap } from 'lucide-react';

export default function StudentWeeklyChallenges() {
  const { data: challenges } = trpc.weeklyChallenges.getCurrent.useQuery();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Desafios Semanais CTF</h1>
        <p className="text-gray-600">Resolva problemas técnicos e ganhe pontos e Tech Coins!</p>
      </div>
      
      {/* Desafios Individuais */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-500" />
          Desafios Individuais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challenges?.filter(c => c.challengeType.startsWith('individual')).map((challenge) => (
            <Card key={challenge.id} className="p-6 border-l-4" style={{ borderLeftColor: challenge.difficulty === 'easy' ? '#10b981' : challenge.difficulty === 'medium' ? '#f59e0b' : '#ef4444' }}>
              <div className="flex items-start justify-between mb-3">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {formatTimeRemaining(challenge.endsAt)}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{challenge.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold">{challenge.pointsReward} pts</span>
                  </div>
                  {challenge.techCoinsReward > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold">{challenge.techCoinsReward}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button className="w-full">Resolver Desafio</Button>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Desafios em Equipe */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          Desafios Colaborativos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges?.filter(c => c.challengeType === 'team_project').map((challenge) => (
            <Card key={challenge.id} className="p-6 border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-3">
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                  EQUIPE (3-4 alunos)
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {formatTimeRemaining(challenge.endsAt)}
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{challenge.description}</p>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span className="font-semibold">{challenge.pointsReward} pts/membro</span>
                </div>
                {challenge.techCoinsReward > 0 && (
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold">{challenge.techCoinsReward}/membro</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">Criar Equipe</Button>
                <Button variant="outline" className="flex-1">Entrar em Equipe</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 FASE 5: Priorização de Implementação

### Implementação Imediata (Hoje)

**1. Sistema de Tech Coins (2-3 horas)**
- ✅ Criar tabelas no banco
- ✅ Implementar funções básicas (adicionar, gastar, consultar)
- ✅ Criar 10-15 itens iniciais na loja
- ✅ Interface básica da loja

**2. Conquistas Ocultas (1-2 horas)**
- ✅ Criar tabela de hidden_achievements
- ✅ Inserir 10 conquistas secretas
- ✅ Implementar sistema de detecção automática
- ✅ Notificação ao desbloquear

**3. Modo Hardcore (1 hora)**
- ✅ Adicionar multiplicadores aos exercícios existentes
- ✅ Interface para ativar modo hardcore
- ✅ Leaderboard separado

### Implementação Semana 1 (Próximos 7 dias)

**4. Sistema de Especialização (4-5 horas)**
- ✅ Criar 5 trilhas iniciais (Web, Segurança, Dados, DevOps, Mobile)
- ✅ Definir 3 níveis por trilha
- ✅ Interface completa de especialização

**5. Desafios Semanais CTF (3-4 horas)**
- ✅ Estrutura de desafios
- ✅ Interface de submissão
- ✅ Sistema de equipes
- ✅ Criar 4 desafios para primeira semana

### Implementação Semana 2-3

**6. Mentoria Gamificada (3-4 horas)**
**7. Boss Battles (4-5 horas)**
**8. Sistema de Temporadas (3-4 horas)**

---

## 📊 Métricas de Sucesso

Após implementação, monitorar:

- Taxa de engajamento diário (+30% esperado)
- Tempo médio na plataforma (+45% esperado)
- Conclusão de exercícios (+25% esperado)
- Satisfação dos alunos (NPS > 50)

---

**Documento criado:** Janeiro 2025  
**Próxima revisão:** Após implementação da Fase 1
