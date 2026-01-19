# Guia de Implementação: Verificação de E-mail

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Prioridade:** Alta  
**Tempo estimado:** 2-3 horas

---

## Visão Geral

A verificação de e-mail é uma funcionalidade essencial para garantir que os usuários cadastrados possuem acesso ao e-mail informado. Este guia apresenta a implementação completa do sistema de verificação de e-mail para o FlowEdu.

---

## Arquitetura da Solução

O sistema de verificação de e-mail seguirá o seguinte fluxo:

**Cadastro de Novo Usuário:**
1. Usuário preenche formulário de cadastro
2. Sistema cria conta com `emailVerified: false`
3. Sistema gera token de verificação único
4. Sistema envia e-mail com link de verificação
5. Usuário clica no link e confirma e-mail
6. Sistema marca `emailVerified: true`

**Reenvio de E-mail:**
- Usuário pode solicitar reenvio do e-mail de verificação
- Sistema valida se e-mail já não foi verificado
- Sistema gera novo token e envia novo e-mail

---

## Passo 1: Atualizar Schema do Banco de Dados

Adicionar campos necessários na tabela `users`:

```typescript
// drizzle/schema.ts
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  
  // NOVOS CAMPOS
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

**Executar migração:**

```bash
cd /home/ubuntu/teacher_schedule_system
pnpm db:push
```

---

## Passo 2: Criar Funções de Geração de Token

```typescript
// server/db.ts

import crypto from 'crypto';

/**
 * Gerar token de verificação de e-mail
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Criar registro de verificação de e-mail
 */
export async function createEmailVerification(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = generateEmailVerificationToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token válido por 24 horas
  
  await db.update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationExpires: expires
    })
    .where(eq(users.id, userId));
  
  return token;
}

/**
 * Verificar e-mail com token
 */
export async function verifyEmailWithToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await db.select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);
  
  if (!user || user.length === 0) {
    throw new Error("Token inválido");
  }
  
  const userData = user[0];
  
  // Verificar se token expirou
  if (userData.emailVerificationExpires && userData.emailVerificationExpires < new Date()) {
    throw new Error("Token expirado");
  }
  
  // Marcar e-mail como verificado
  await db.update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    })
    .where(eq(users.id, userData.id));
  
  return userData;
}
```

---

## Passo 3: Criar Template de E-mail

```typescript
// server/_core/emailTemplates.ts

export function getEmailVerificationTemplate(name: string, verificationUrl: string) {
  return {
    subject: "Verifique seu e-mail - FlowEdu",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 FlowEdu</h1>
            <p>Onde a educação flui</p>
          </div>
          <div class="content">
            <h2>Olá, ${name}!</h2>
            <p>Obrigado por se cadastrar no FlowEdu. Para completar seu cadastro, precisamos verificar seu e-mail.</p>
            <p>Clique no botão abaixo para verificar seu e-mail:</p>
            <center>
              <a href="${verificationUrl}" class="button">Verificar E-mail</a>
            </center>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>Este link é válido por 24 horas.</strong></p>
            <p>Se você não se cadastrou no FlowEdu, ignore este e-mail.</p>
          </div>
          <div class="footer">
            <p>© 2026 FlowEdu - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá, ${name}!
      
      Obrigado por se cadastrar no FlowEdu. Para completar seu cadastro, precisamos verificar seu e-mail.
      
      Acesse o link abaixo para verificar seu e-mail:
      ${verificationUrl}
      
      Este link é válido por 24 horas.
      
      Se você não se cadastrou no FlowEdu, ignore este e-mail.
      
      © 2026 FlowEdu
    `
  };
}
```

---

## Passo 4: Criar Função de Envio de E-mail

O FlowEdu já possui integração com Resend (variável `RESEND_API_KEY`). Usar a biblioteca existente:

```typescript
// server/_core/email.ts

import { Resend } from 'resend';
import { ENV } from './env';

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
) {
  const verificationUrl = `${ENV.VITE_APP_URL}/verify-email?token=${token}`;
  const template = getEmailVerificationTemplate(name, verificationUrl);
  
  try {
    const result = await resend.emails.send({
      from: ENV.EMAIL_FROM || 'FlowEdu <noreply@flowedu.com>',
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    return result;
  } catch (error) {
    console.error('[Email] Erro ao enviar e-mail de verificação:', error);
    throw new Error('Falha ao enviar e-mail de verificação');
  }
}
```

---

## Passo 5: Atualizar Rota de Cadastro

```typescript
// server/routers.ts

auth: router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
    }))
    .mutation(async ({ input }) => {
      // Verificar se e-mail já existe
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      // Criar usuário com emailVerified: false
      const result = await db.createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        emailVerified: false
      });
      
      const userId = result[0].insertId;
      
      // Gerar token de verificação
      const token = await db.createEmailVerification(userId);
      
      // Enviar e-mail de verificação
      try {
        await sendVerificationEmail(input.email, input.name, token);
      } catch (error) {
        console.error('[Auth] Erro ao enviar e-mail de verificação:', error);
        // Não bloquear cadastro se e-mail falhar
      }
      
      return {
        success: true,
        message: "Cadastro realizado! Verifique seu e-mail para ativar sua conta."
      };
    }),
  
  // Nova rota: Verificar e-mail
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const user = await db.verifyEmailWithToken(input.token);
        return {
          success: true,
          message: "E-mail verificado com sucesso!",
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Token inválido ou expirado"
        });
      }
    }),
  
  // Nova rota: Reenviar e-mail de verificação
  resendVerificationEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = ctx.user;
      
      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "E-mail já verificado"
        });
      }
      
      // Gerar novo token
      const token = await db.createEmailVerification(user.id);
      
      // Enviar e-mail
      await sendVerificationEmail(user.email, user.name, token);
      
      return {
        success: true,
        message: "E-mail de verificação reenviado!"
      };
    }),
}),
```

---

## Passo 6: Criar Página de Verificação de E-mail

```typescript
// client/src/pages/VerifyEmail.tsx

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);
  
  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    }
  });
  
  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    }
  }, [token]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Verificação de E-mail</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {verifyMutation.isLoading && (
            <>
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-blue-600" />
              <p>Verificando seu e-mail...</p>
            </>
          )}
          
          {verifyMutation.isSuccess && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h3 className="text-xl font-semibold text-green-600">E-mail Verificado!</h3>
              <p>Seu e-mail foi verificado com sucesso. Redirecionando para o login...</p>
            </>
          )}
          
          {verifyMutation.isError && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-600" />
              <h3 className="text-xl font-semibold text-red-600">Erro na Verificação</h3>
              <p>{verifyMutation.error.message}</p>
              <Button onClick={() => setLocation('/login')}>
                Voltar para o Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Passo 7: Adicionar Rota no App.tsx

```typescript
// client/src/App.tsx

import VerifyEmail from "./pages/VerifyEmail";

// Adicionar rota
<Route path="/verify-email" component={VerifyEmail} />
```

---

## Passo 8: Adicionar Banner de Verificação Pendente

```typescript
// client/src/components/EmailVerificationBanner.tsx

import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { data: user } = trpc.auth.me.useQuery();
  const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("E-mail de verificação reenviado!");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
  
  if (!user || user.emailVerified) return null;
  
  return (
    <Alert className="bg-yellow-50 border-yellow-200">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada.</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => resendMutation.mutate()}
          disabled={resendMutation.isLoading}
        >
          {resendMutation.isLoading ? "Enviando..." : "Reenviar E-mail"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

Adicionar o banner no layout principal (DashboardLayout ou App.tsx).

---

## Passo 9: Configurar Variável de Ambiente

Adicionar no arquivo `.env` (ou configurar no painel do VPS):

```bash
# E-mail de envio (Resend)
EMAIL_FROM="FlowEdu <noreply@seudominio.com.br>"

# URL da aplicação (para gerar links de verificação)
VITE_APP_URL="https://seudominio.com.br"
```

---

## Checklist de Implementação

- [ ] Atualizar schema do banco de dados (adicionar campos emailVerified, emailVerificationToken, emailVerificationExpires)
- [ ] Executar migração (`pnpm db:push`)
- [ ] Criar funções de geração e verificação de token no `server/db.ts`
- [ ] Criar template de e-mail em `server/_core/emailTemplates.ts`
- [ ] Criar função de envio de e-mail em `server/_core/email.ts`
- [ ] Atualizar rota de cadastro (`auth.register`)
- [ ] Criar rota de verificação (`auth.verifyEmail`)
- [ ] Criar rota de reenvio (`auth.resendVerificationEmail`)
- [ ] Criar página `VerifyEmail.tsx`
- [ ] Adicionar rota `/verify-email` no App.tsx
- [ ] Criar componente `EmailVerificationBanner.tsx`
- [ ] Adicionar banner no layout principal
- [ ] Configurar variáveis de ambiente (EMAIL_FROM, VITE_APP_URL)
- [ ] Testar fluxo completo de verificação

---

## Testes Recomendados

**Teste 1: Cadastro com Verificação**
1. Cadastrar novo usuário
2. Verificar se e-mail foi enviado
3. Clicar no link de verificação
4. Verificar se conta foi ativada

**Teste 2: Token Expirado**
1. Gerar token de verificação
2. Alterar manualmente a data de expiração no banco
3. Tentar verificar com token expirado
4. Verificar mensagem de erro

**Teste 3: Reenvio de E-mail**
1. Cadastrar usuário sem verificar
2. Fazer login
3. Clicar em "Reenviar E-mail"
4. Verificar se novo e-mail foi enviado

---

## Considerações de Segurança

**Proteções Implementadas:**
- Token único gerado com `crypto.randomBytes(32)`
- Token válido por apenas 24 horas
- Token é invalidado após uso
- E-mail não pode ser verificado duas vezes

**Recomendações Adicionais:**
- Limitar número de reenvios de e-mail (máximo 3 por hora)
- Adicionar CAPTCHA no formulário de cadastro
- Monitorar tentativas de verificação com tokens inválidos

---

## Estimativa de Tempo

| Tarefa | Tempo Estimado |
|--------|----------------|
| Atualizar schema e migração | 15 minutos |
| Criar funções de token | 30 minutos |
| Criar templates de e-mail | 20 minutos |
| Atualizar rotas backend | 30 minutos |
| Criar página de verificação | 30 minutos |
| Criar banner de verificação | 20 minutos |
| Testes e ajustes | 30 minutos |
| **Total** | **2h 55min** |

---

*Guia criado por Manus AI em 19/01/2026*
