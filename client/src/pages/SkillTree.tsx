import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Code, Palette, Database, Server, Lock, CheckCircle2, Sparkles, Trophy, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';

const specializationInfo = {
  code_warrior: {
    name: 'Guerreiro do Código',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
  },
  interface_master: {
    name: 'Mestre das Interfaces',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
  },
  data_sage: {
    name: 'Sábio dos Dados',
    icon: Database,
    color: 'from-green-500 to-emerald-500',
  },
  system_architect: {
    name: 'Arquiteto de Sistemas',
    icon: Server,
    color: 'from-orange-500 to-red-500',
  },
};

export default function SkillTree() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  const { data: spec, isLoading: specLoading } = trpc.specializations.getMy.useQuery();
  const { data: skillTree, isLoading: treeLoading } = trpc.specializations.getSkillTree.useQuery(
    { specialization: spec?.specialization || '' },
    { enabled: !!spec }
  );
  const { data: unlockedSkills } = trpc.specializations.getMySkills.useQuery();
  const { data: points } = trpc.gamification.getStudentStats.useQuery();

  const unlockMutation = trpc.specializations.unlockSkill.useMutation({
    onSuccess: () => {
      toast.success('Skill desbloqueada com sucesso!');
      setSelectedSkill(null);
    },
    onError: (error) => {
      toast.error('Erro ao desbloquear skill', {
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (!specLoading && !spec) {
      navigate('/student/choose-specialization');
    }
  }, [spec, specLoading, navigate]);

  if (specLoading || treeLoading || !spec) {
    return (
      <div className="flex">
        <Sidebar />
        <PageWrapper>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl">Carregando...</div>
          </div>
        </PageWrapper>
      </div>
    );
  }

  const specInfo = specializationInfo[spec.specialization as keyof typeof specializationInfo];
  const Icon = specInfo.icon;

  const unlockedSkillIds = new Set(unlockedSkills?.map(s => s.skillId) || []);

  const isSkillUnlocked = (skillId: number) => unlockedSkillIds.has(skillId);

  const canUnlock = (skill: any) => {
    if (isSkillUnlocked(skill.id)) return false;
    if (skill.requiredLevel > (spec.level || 1)) return false;

    if (skill.prerequisiteSkills) {
      try {
        const prereqs = JSON.parse(skill.prerequisiteSkills);
        const prereqSkills = skillTree?.filter(s => prereqs.includes(s.skillKey)) || [];
        return prereqSkills.every(s => isSkillUnlocked(s.id));
      } catch {
        return true;
      }
    }

    return true;
  };

  const handleUnlock = (skill: any) => {
    if (!canUnlock(skill)) {
      toast.error('Você ainda não pode desbloquear esta skill');
      return;
    }

    unlockMutation.mutate({ skillId: skill.id });
  };

  // Agrupar skills por tier
  const skillsByTier = skillTree?.reduce((acc, skill) => {
    if (!acc[skill.tier]) acc[skill.tier] = [];
    acc[skill.tier].push(skill);
    return acc;
  }, {} as Record<number, any[]>) || {};

  const currentLevel = spec.level || 1;
  const nextLevelPoints = currentLevel * 500;
  const currentPoints = points?.totalPoints || 0;
  const progressToNextLevel = ((currentPoints % 500) / 500) * 100;

  return (
    <div className="flex">
      <Sidebar />
      <PageWrapper>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate('/student/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full bg-gradient-to-r ${specInfo.color}`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{specInfo.name}</h1>
                  <p className="text-muted-foreground">Nível {currentLevel}</p>
                </div>
              </div>
            </div>

            <Card className="w-80">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Progresso de Nível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Nível {currentLevel}</span>
                    <span>Nível {currentLevel + 1}</span>
                  </div>
                  <Progress value={progressToNextLevel} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {currentPoints % 500} / 500 pontos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Título Honorífico - TODO: Adicionar quando backend estiver pronto */}

          {/* Skill Tree */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Árvore de Habilidades</h2>
            </div>

            {Object.entries(skillsByTier)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, skills]) => (
                <div key={tier} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-4 py-1">
                      Tier {tier}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skills.map((skill) => {
                      const unlocked = isSkillUnlocked(skill.id);
                      const canBeUnlocked = canUnlock(skill);

                      return (
                        <Card
                          key={skill.id}
                          className={`transition-all duration-300 ${
                            unlocked
                              ? 'bg-green-50 border-green-500 shadow-lg'
                              : canBeUnlocked
                              ? 'hover:shadow-xl cursor-pointer border-yellow-400'
                              : 'opacity-60'
                          }`}
                          onClick={() => canBeUnlocked && setSelectedSkill(skill)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">{skill.name}</CardTitle>
                              {unlocked ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <Lock className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <CardDescription>{skill.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary">Nível {skill.requiredLevel}</Badge>
                              <Badge
                                variant={skill.bonusType === 'points_multiplier' ? 'default' : 'outline'}
                              >
                                {skill.bonusType === 'points_multiplier'
                                  ? `+${((skill.bonusValue - 1) * 100).toFixed(0)}% pontos`
                                  : `+${((skill.bonusValue - 1) * 100).toFixed(0)}% precisão`}
                              </Badge>
                            </div>

                            {!unlocked && canBeUnlocked && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlock(skill);
                                }}
                                disabled={unlockMutation.isPending}
                              >
                                Desbloquear
                              </Button>
                            )}

                            {!unlocked && !canBeUnlocked && (
                              <p className="text-xs text-muted-foreground">
                                {skill.requiredLevel > currentLevel
                                  ? `Requer nível ${skill.requiredLevel}`
                                  : 'Requer skills anteriores'}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
