import { Resend } from 'resend';

// Inicializar Resend com API key do ambiente
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envia um e-mail usando Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured, email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // Usar domínio padrão do Resend (onboarding@resend.dev) para evitar erros de domínio não verificado
    // O domínio personalizado requer verificação no painel do Resend: https://resend.com/domains
    const defaultFrom = 'Sistema de Gestão Educacional <onboarding@resend.dev>';
    const emailFrom = from || defaultFrom;
    
    const result = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('Failed to send email:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Template de e-mail de convite
 */
export function getInviteEmailTemplate(inviteLink: string, inviterName: string, role: 'admin' | 'user'): string {
  const roleText = role === 'admin' ? 'Administrador' : 'Professor';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para o Sistema de Gestão</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎓 Sistema de Gestão de Tempo para Professores
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">
                Você foi convidado!
              </h2>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Olá! 👋
              </p>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> convidou você para se juntar ao <strong>Sistema de Gestão de Tempo para Professores</strong> como <strong>${roleText}</strong>.
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Este sistema permite gerenciar disciplinas, turmas, horários e planos de curso de forma eficiente e organizada.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Aceitar Convite →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                ${inviteLink}
              </p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 13px; line-height: 1.6;">
                  <strong>Nota:</strong> Este convite é pessoal e intransferível. Se você não esperava este convite, pode ignorar este e-mail com segurança.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sistema de Gestão de Tempo para Professores
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template de e-mail de recuperação de senha
 */
export function getPasswordResetEmailTemplate(resetLink: string, userName?: string): string {
  const greeting = userName ? `Olá, ${userName}!` : 'Olá!';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🔐 Recuperação de Senha
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Gestão de Professores.
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Redefinir Minha Senha →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Atenção:</strong> Este link expira em <strong>1 hora</strong>.
                </p>
              </div>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Se você não solicitou esta recuperação, pode ignorar este e-mail com segurança.
              </p>
              
              <p style="margin: 24px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sistema de Gestão de Tempo para Professores
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envia e-mail de recuperação de senha
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/redefinir-senha?token=${token}`;
  
  const html = getPasswordResetEmailTemplate(resetLink, userName);
  
  return sendEmail({
    to: email,
    subject: '🔐 Recuperação de Senha - Sistema de Gestão de Professores',
    html,
  });
}

/**
 * Template de e-mail de boas-vindas
 */
export function getWelcomeEmailTemplate(userName: string, role: 'admin' | 'user'): string {
  const roleText = role === 'admin' ? 'Administrador' : 'Professor';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Sistema</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎉 Bem-vindo, ${userName}!
              </h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Sua conta foi criada com sucesso como <strong>${roleText}</strong>!
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Você já pode começar a usar o sistema para gerenciar suas disciplinas, turmas e horários.
              </p>
              
              <div style="background-color: #f7fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea;">
                <p style="margin: 0 0 12px; color: #2d3748; font-size: 15px; font-weight: 600;">
                  Próximos passos:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                  <li>Configure seu perfil</li>
                  <li>Cadastre suas disciplinas</li>
                  <li>Crie suas turmas</li>
                  <li>Monte sua grade de horários</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sistema de Gestão de Tempo para Professores
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


/**
 * Template de e-mail para cadastro manual
 */
export function getManualRegistrationEmailTemplate(userName: string, role: 'admin' | 'user'): string {
  const roleText = role === 'admin' ? 'Administrador' : 'Professor';
  const loginUrl = process.env.VITE_OAUTH_PORTAL_URL || 'http://localhost:3000';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Criada - Sistema de Gestão</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ✅ Conta Criada com Sucesso!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a202c; font-size: 24px; font-weight: 600;">
                Olá, ${userName}!
              </h2>
              
              <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Uma conta foi criada para você no <strong>Sistema de Gestão de Tempo para Professores</strong> com o papel de <strong>${roleText}</strong>.
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Para acessar o sistema, clique no botão abaixo e faça login usando sua conta Google ou GitHub:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Acessar Sistema →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #f7fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin-top: 24px;">
                <p style="margin: 0 0 12px; color: #2d3748; font-size: 15px; font-weight: 600;">
                  📋 Próximos passos:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px; line-height: 1.8;">
                  <li>Faça login usando sua conta Google ou GitHub</li>
                  <li>Configure seu perfil pessoal</li>
                  <li>Cadastre suas disciplinas e turmas</li>
                  <li>Monte sua grade de horários</li>
                  <li>Explore todas as funcionalidades do sistema</li>
                </ul>
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 13px; line-height: 1.6;">
                  <strong>Nota:</strong> Este e-mail foi enviado porque um administrador criou uma conta para você. Se você não esperava este e-mail, entre em contato com o administrador do sistema.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 24px 40px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">
                © ${new Date().getFullYear()} Sistema de Gestão de Tempo para Professores
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
