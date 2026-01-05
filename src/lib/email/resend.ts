// lib/email/resend.ts

import { Resend } from 'resend'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

// Nome e email do remetente
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@seudominio.com'
const SALON_NAME = process.env.SALON_NAME || 'Henrique Bilro'

interface PasswordResetEmailParams {
    to: string
    resetUrl: string
    userName?: string
}

export async function sendPasswordResetEmail({
    to,
    resetUrl,
    userName,
}: PasswordResetEmailParams) {
    const startTime = Date.now()

    try {
        console.log(`📧 Enviando email de reset para: ${to}`)

        const { data, error } = await resend.emails.send({
            from: `${SALON_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject: `Redefinir senha - ${SALON_NAME}`,
            html: generatePasswordResetHTML(resetUrl, userName),
            // Adicionar tags para tracking
            tags: [
                { name: 'type', value: 'password-reset' },
                { name: 'environment', value: process.env.NODE_ENV || 'development' },
            ],
        })

        const duration = Date.now() - startTime

        if (error) {
            console.error(`❌ Erro Resend (${duration}ms):`, error)
            throw new Error(`Falha ao enviar email: ${error.message}`)
        }

        console.log(`✅ Email enviado com sucesso em ${duration}ms`)
        console.log(`📬 ID do email: ${data?.id}`)

        return { success: true, id: data?.id, duration }
    } catch (error: any) {
        const duration = Date.now() - startTime
        console.error(`❌ Erro ao enviar email (${duration}ms):`, error)
        throw error
    }
}

// Template HTML do email
function generatePasswordResetHTML(resetUrl: string, userName?: string): string {
    const greeting = userName ? `Olá, ${userName}!` : 'Olá!'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - ${SALON_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${SALON_NAME}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px;">${greeting}</h2>
                            <p style="color: #555555; line-height: 1.6; font-size: 16px;">
                                Recebemos uma solicitação para redefinir a senha da sua conta.
                            </p>
                            <p style="color: #555555; line-height: 1.6; font-size: 16px;">
                                Clique no botão abaixo para criar uma nova senha:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; 
                                                  background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%);
                                                  color: #ffffff; 
                                                  text-decoration: none; 
                                                  padding: 16px 40px; 
                                                  border-radius: 6px; 
                                                  font-size: 16px; 
                                                  font-weight: bold;
                                                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                            Redefinir Minha Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #777777; line-height: 1.6; font-size: 14px; margin-top: 30px;">
                                Ou copie e cole este link no seu navegador:
                            </p>
                            <p style="color: #3498db; line-height: 1.6; font-size: 14px; word-break: break-all;">
                                ${resetUrl}
                            </p>
                            
                            <!-- Warning -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 30px; border-radius: 4px;">
                                <p style="color: #856404; margin: 0; font-size: 14px;">
                                    ⚠️ <strong>Este link expira em 1 hora.</strong><br>
                                    Se você não solicitou esta alteração, ignore este email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} ${SALON_NAME}. Todos os direitos reservados.
                            </p>
                            <p style="color: #999999; margin: 10px 0 0 0; font-size: 12px;">
                                Este é um email automático. Por favor, não responda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `
}

// Função para verificar saúde do serviço
export async function checkEmailServiceHealth(): Promise<boolean> {
    try {
        // Fazer uma chamada simples à API do Resend para verificar conectividade
        // Nota: Resend não tem endpoint de health check, mas podemos verificar a chave
        const isConfigured = !!process.env.RESEND_API_KEY

        if (!isConfigured) {
            console.error('❌ RESEND_API_KEY não configurada')
            return false
        }

        console.log('✅ Serviço de email configurado corretamente')
        return true
    } catch (error) {
        console.error('❌ Erro ao verificar serviço de email:', error)
        return false
    }
}