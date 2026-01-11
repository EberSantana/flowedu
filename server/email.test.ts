import { describe, it, expect } from "vitest";
import { sendEmail } from "./_core/email";

describe("Email Service Tests", () => {
  it("should validate Resend API key configuration", async () => {
    // Tentar enviar e-mail de teste
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Email",
      html: "<p>This is a test email</p>",
    });

    // Se RESEND_API_KEY não estiver configurado, deve retornar erro específico
    if (!process.env.RESEND_API_KEY) {
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email service not configured");
    } else {
      // Se configurado, deve retornar sucesso ou erro de API válido
      // (não erro de configuração)
      expect(result.error).not.toBe("Email service not configured");
    }
  }, 10000); // Timeout de 10s para chamada de API
});
