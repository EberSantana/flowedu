/**
 * =====================================================
 * FLOWEDU - CONFIGURAÇÃO CENTRAL DE CORES DOS BOTÕES
 * =====================================================
 * 
 * Este arquivo define a paleta de cores padronizada para todos os botões
 * do sistema FlowEdu. Use estas classes para garantir consistência visual
 * em todo o projeto.
 * 
 * REGRAS IMPORTANTES:
 * 1. NUNCA use cores com transparência (ex: primary/80, bg-blue-500/50)
 * 2. SEMPRE use cores sólidas para garantir visibilidade
 * 3. SEMPRE inclua text-white para botões coloridos
 * 4. Use estas constantes em vez de definir cores inline
 * 
 * @author FlowEdu Team
 * @version 1.0.0
 * @date 15/01/2026
 */

// =====================================================
// CORES PRIMÁRIAS - Ações principais do sistema
// =====================================================

/**
 * Botão primário padrão - Roxo (cor principal do FlowEdu)
 * Uso: Ações principais, CTAs, botões de destaque
 */
export const BTN_PRIMARY = "bg-purple-600 hover:bg-purple-700 text-white";

/**
 * Botão primário alternativo - Azul
 * Uso: Ações secundárias importantes, links de navegação
 */
export const BTN_PRIMARY_ALT = "bg-blue-600 hover:bg-blue-700 text-white";

// =====================================================
// CORES DE AÇÃO - Operações específicas
// =====================================================

/**
 * Botão de sucesso/confirmação - Verde
 * Uso: Salvar, confirmar, aprovar, matricular
 */
export const BTN_SUCCESS = "bg-emerald-600 hover:bg-emerald-700 text-white";

/**
 * Botão de perigo/exclusão - Vermelho
 * Uso: Excluir, remover, cancelar ação destrutiva
 */
export const BTN_DANGER = "bg-red-600 hover:bg-red-700 text-white";

/**
 * Botão de aviso/atenção - Amarelo/Âmbar
 * Uso: Alertas, ações que requerem atenção
 */
export const BTN_WARNING = "bg-amber-600 hover:bg-amber-700 text-white";

/**
 * Botão de informação - Azul claro
 * Uso: Ver detalhes, informações adicionais
 */
export const BTN_INFO = "bg-sky-600 hover:bg-sky-700 text-white";

// =====================================================
// CORES NEUTRAS - Ações secundárias
// =====================================================

/**
 * Botão neutro/secundário - Cinza
 * Uso: Editar, configurações, ações secundárias
 */
export const BTN_NEUTRAL = "bg-slate-600 hover:bg-slate-700 text-white";

/**
 * Botão de cancelar - Cinza claro
 * Uso: Cancelar, fechar, voltar
 */
export const BTN_CANCEL = "bg-gray-500 hover:bg-gray-600 text-white";

// =====================================================
// CORES TEMÁTICAS - Funcionalidades específicas
// =====================================================

/**
 * Botão de trilhas de aprendizagem - Roxo
 * Uso: Acessar trilhas, módulos, tópicos
 */
export const BTN_LEARNING_PATH = "bg-purple-600 hover:bg-purple-700 text-white";

/**
 * Botão de exercícios - Laranja
 * Uso: Iniciar exercício, praticar, revisar
 */
export const BTN_EXERCISE = "bg-orange-600 hover:bg-orange-700 text-white";

/**
 * Botão de estatísticas/análise - Índigo
 * Uso: Ver estatísticas, relatórios, análises
 */
export const BTN_STATS = "bg-indigo-600 hover:bg-indigo-700 text-white";

/**
 * Botão de dúvidas/suporte - Rosa
 * Uso: Tirar dúvidas, suporte, ajuda
 */
export const BTN_SUPPORT = "bg-pink-600 hover:bg-pink-700 text-white";

/**
 * Botão de diário/anotações - Azul
 * Uso: Acessar diário, anotações, registros
 */
export const BTN_DIARY = "bg-blue-600 hover:bg-blue-700 text-white";

/**
 * Botão de alunos/matrícula - Verde
 * Uso: Matricular alunos, gerenciar turmas
 */
export const BTN_STUDENTS = "bg-emerald-600 hover:bg-emerald-700 text-white";

/**
 * Botão de avisos/notificações - Âmbar
 * Uso: Ver avisos, notificações
 */
export const BTN_ANNOUNCEMENTS = "bg-amber-600 hover:bg-amber-700 text-white";

// =====================================================
// VARIANTES DE TAMANHO
// =====================================================

/**
 * Classes de tamanho para botões
 */
export const BTN_SIZE = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
  xl: "px-8 py-4 text-xl",
};

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Combina classes de botão com tamanho
 * @param color - Classe de cor do botão
 * @param size - Tamanho do botão (xs, sm, md, lg, xl)
 * @returns String com todas as classes combinadas
 * 
 * @example
 * const classes = buttonClass(BTN_PRIMARY, 'md');
 * // Retorna: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-base"
 */
export function buttonClass(color: string, size: keyof typeof BTN_SIZE = 'md'): string {
  return `${color} ${BTN_SIZE[size]}`;
}

/**
 * Mapa de cores por tipo de ação
 * Útil para seleção dinâmica de cores
 */
export const BUTTON_COLOR_MAP = {
  primary: BTN_PRIMARY,
  primaryAlt: BTN_PRIMARY_ALT,
  success: BTN_SUCCESS,
  danger: BTN_DANGER,
  warning: BTN_WARNING,
  info: BTN_INFO,
  neutral: BTN_NEUTRAL,
  cancel: BTN_CANCEL,
  learningPath: BTN_LEARNING_PATH,
  exercise: BTN_EXERCISE,
  stats: BTN_STATS,
  support: BTN_SUPPORT,
  diary: BTN_DIARY,
  students: BTN_STUDENTS,
  announcements: BTN_ANNOUNCEMENTS,
} as const;

export type ButtonColorType = keyof typeof BUTTON_COLOR_MAP;

/**
 * Obtém a classe de cor pelo tipo
 * @param type - Tipo de botão
 * @returns Classe CSS do botão
 * 
 * @example
 * const color = getButtonColor('success');
 * // Retorna: "bg-emerald-600 hover:bg-emerald-700 text-white"
 */
export function getButtonColor(type: ButtonColorType): string {
  return BUTTON_COLOR_MAP[type];
}

// =====================================================
// DOCUMENTAÇÃO DE USO
// =====================================================

/**
 * GUIA DE USO:
 * 
 * 1. Importar as constantes necessárias:
 *    import { BTN_PRIMARY, BTN_SUCCESS, BTN_DANGER } from '@/lib/button-styles';
 * 
 * 2. Usar diretamente no className:
 *    <Button className={BTN_PRIMARY}>Salvar</Button>
 * 
 * 3. Combinar com outras classes:
 *    <Button className={\`\${BTN_SUCCESS} w-full\`}>Confirmar</Button>
 * 
 * 4. Usar com a função utilitária:
 *    <Button className={buttonClass(BTN_PRIMARY, 'lg')}>Ação Principal</Button>
 * 
 * MAPEAMENTO POR FUNCIONALIDADE:
 * 
 * | Ação                    | Constante          | Cor        |
 * |-------------------------|--------------------| -----------|
 * | Ação principal/CTA      | BTN_PRIMARY        | Roxo       |
 * | Salvar/Confirmar        | BTN_SUCCESS        | Verde      |
 * | Excluir/Remover         | BTN_DANGER         | Vermelho   |
 * | Editar/Configurar       | BTN_NEUTRAL        | Cinza      |
 * | Cancelar/Voltar         | BTN_CANCEL         | Cinza claro|
 * | Ver detalhes            | BTN_INFO           | Azul claro |
 * | Trilhas de aprendizagem | BTN_LEARNING_PATH  | Roxo       |
 * | Exercícios              | BTN_EXERCISE       | Laranja    |
 * | Estatísticas            | BTN_STATS          | Índigo     |
 * | Matricular alunos       | BTN_STUDENTS       | Verde      |
 * | Avisos                  | BTN_ANNOUNCEMENTS  | Âmbar      |
 */
