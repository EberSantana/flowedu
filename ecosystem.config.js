/**
 * PM2 Ecosystem Configuration
 * FlowEdu - Sistema de Gestão de Tempo para Professores
 * 
 * Uso:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 restart flowedu
 *   pm2 logs flowedu
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'flowedu',
      script: 'dist/server/_core/index.js',
      cwd: '/var/www/flowedu',
      
      // Ambiente de produção
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Ambiente de desenvolvimento (para testes locais)
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // Configurações de processo
      instances: 'max', // Usar todos os CPUs disponíveis
      exec_mode: 'cluster', // Modo cluster para melhor performance
      
      // Reinício automático
      autorestart: true,
      watch: false, // Desabilitado em produção
      max_memory_restart: '1G', // Reiniciar se usar mais de 1GB RAM
      
      // Logs
      log_file: '/var/log/flowedu/combined.log',
      out_file: '/var/log/flowedu/out.log',
      error_file: '/var/log/flowedu/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Configurações de reinício
      min_uptime: '10s', // Tempo mínimo antes de considerar "iniciado"
      max_restarts: 10, // Máximo de reinícios em caso de falha
      restart_delay: 4000, // 4 segundos entre reinícios
      
      // Graceful shutdown
      kill_timeout: 5000, // 5 segundos para encerrar graciosamente
      listen_timeout: 8000, // 8 segundos para iniciar
      
      // Variáveis de ambiente (serão sobrescritas pelo .env)
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
  
  // Configuração de deploy (opcional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'SEU_IP_VPS',
      ref: 'origin/main',
      repo: 'git@github.com:SEU_USUARIO/flowedu.git',
      path: '/var/www/flowedu',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
