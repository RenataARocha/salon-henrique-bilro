// src/lib/email/notificationEmails.ts
// Templates de email para notificações do sistema

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'

// ============================================
// 1. EMAIL DE AGENDAMENTO CRIADO COM BOTÃO
// ============================================
export async function sendAppointmentConfirmationEmail(data: {
    to: string
    name: string
    service: string
    date: string
    time: string
    price: number
    appointmentId?: string
}) {
    try {
        await resend.emails.send({
            from: 'Henrique Bilro <onboarding@resend.dev>',
            to: data.to,
            subject: '✅ Agendamento Confirmado - Henrique Bilro',
            html: appointmentConfirmationTemplate(data),
        })
        return { success: true }
    } catch (error) {
        console.error('❌ Erro ao enviar email de confirmação:', error)
        return { success: false, error }
    }
}

// ============================================
// 2. EMAIL DE LEMBRETE COM BOTÃO
// ============================================
export async function sendAppointmentReminderEmail(data: {
    to: string
    name: string
    service: string
    date: string
    time: string
    appointmentId?: string
}) {
    try {
        await resend.emails.send({
            from: 'Henrique Bilro <onboarding@resend.dev>',
            to: data.to,
            subject: '⏰ Lembrete: Seu agendamento é amanhã!',
            html: appointmentReminderTemplate(data),
        })
        return { success: true }
    } catch (error) {
        console.error('❌ Erro ao enviar email de lembrete:', error)
        return { success: false, error }
    }
}

// ============================================
// 3. EMAIL DE ANIVERSÁRIO
// ============================================
export async function sendBirthdayEmail(data: {
    to: string
    name: string
    couponCode: string
    discountValue: number
    expiresAt: string
}) {
    try {
        await resend.emails.send({
            from: 'Henrique Bilro <onboarding@resend.dev>',
            to: data.to,
            subject: '🎂 Feliz Aniversário! Seu presente especial chegou! 🎁',
            html: birthdayEmailTemplate(data),
        })
        return { success: true }
    } catch (error) {
        console.error('❌ Erro ao enviar email de aniversário:', error)
        return { success: false, error }
    }
}

// ============================================
// TEMPLATES HTML
// ============================================

function appointmentConfirmationTemplate(data: {
    name: string
    service: string
    date: string
    time: string
    price: number
    appointmentId?: string
}) {
    const confirmUrl = data.appointmentId
        ? `${SITE_URL}/api/appointments/confirm?id=${data.appointmentId}&token=${generateToken(data.appointmentId)}`
        : ''

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                ✨ Agendamento Confirmado!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333; font-size: 18px; margin: 0 0 20px 0;">
                                Olá, <strong>${data.name}</strong>! 🎉
                            </p>
                            
                            <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                Seu agendamento foi realizado com sucesso:
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fffbf0 0%, #fff8dc 100%); padding: 25px; border-radius: 10px; margin: 0 0 30px 0; border-left: 4px solid #d4af37;">
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
                                    <strong>📅 Data:</strong> ${data.date}
                                </p>
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
                                    <strong>⏰ Horário:</strong> ${data.time}
                                </p>
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
                                    <strong>💅 Serviço:</strong> ${data.service}
                                </p>
                                <p style="margin: 0; color: #333; font-size: 16px;">
                                    <strong>💰 Valor:</strong> R$ ${data.price.toFixed(2)}
                                </p>
                            </div>

                            ${confirmUrl ? `
                            <!-- Botão Confirmar -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);">
                                            ✅ CONFIRMAR PRESENÇA
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 14px; color: #999; text-align: center; margin: 20px 0 30px 0;">
                                Clique no botão acima para confirmar sua presença
                            </p>
                            ` : ''}

                            <div style="background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af37; margin: 0 0 20px 0;">
                                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">
                                    📍 Local:
                                </p>
                                <p style="margin: 0 0 5px 0; color: #92400e; font-size: 14px;">
                                    Henrique Bilro Cabeleireiros
                                </p>
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    Av. Rio Doce, 3101 – Potengi, Natal/RN
                                </p>
                            </div>

                            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #d4af37;">
                                <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">
                                    ⚠️ Importante:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                                    <li>Chegar 5 minutos antes do horário</li>
                                    <li>Cancelamento até 2 horas antes</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                <strong>Henrique Bilro Cabeleireiros</strong>
                            </p>
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                Av. Rio Doce, 3101 – Potengi, Natal/RN<br>
                                (84) 98881-4965
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

function appointmentReminderTemplate(data: {
    name: string
    service: string
    date: string
    time: string
    appointmentId?: string
}) {
    const confirmUrl = data.appointmentId
        ? `${SITE_URL}/api/appointments/confirm?id=${data.appointmentId}&token=${generateToken(data.appointmentId)}`
        : ''

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                                ⏰ Lembrete de Agendamento
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333; font-size: 18px; margin: 0 0 20px 0;">
                                Oi, <strong>${data.name}</strong>! 👋
                            </p>
                            
                            <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                Lembrando que você tem agendamento <strong>amanhã</strong>:
                            </p>
                            
                            <div style="background: #fef3c7; padding: 25px; border-radius: 10px; margin: 0 0 30px 0; border-left: 4px solid #d4af37;">
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
                                    <strong>📅 ${data.date}</strong>
                                </p>
                                <p style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
                                    <strong>⏰ ${data.time}</strong>
                                </p>
                                <p style="margin: 0; color: #333; font-size: 16px;">
                                    💅 ${data.service}
                                </p>
                            </div>

                            ${confirmUrl ? `
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);">
                                            ✅ CONFIRMAR PRESENÇA
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}

                            <p style="color: #666; font-size: 14px; line-height: 22px; margin: 30px 0 0 0;">
                                📍 Av. Rio Doce, 3101 – Potengi, Natal/RN<br><br>
                                Caso precise reagendar ou cancelar, entre em contato o quanto antes!<br>
                                📞 (84) 98881-4965 
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                Te esperamos! ✨
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

function birthdayEmailTemplate(data: {
    name: string
    couponCode: string
    discountValue: number
    expiresAt: string
}) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                    
                    <tr>
                        <td style="padding: 50px 40px; text-align: center; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); border-radius: 12px 12px 0 0;">
                            <div style="font-size: 60px; margin-bottom: 10px;">🎂🎉</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                                FELIZ ANIVERSÁRIO!
                            </h1>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #333; font-size: 20px; margin: 0 0 20px 0; text-align: center;">
                                Querida <strong>${data.name}</strong>! 💖
                            </p>
                            
                            <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; text-align: center;">
                                A equipe Henrique Bilro deseja um dia MARAVILHOSO para você!
                            </p>
                            
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 12px; margin: 0 0 30px 0; border: 3px dashed #d4af37; text-align: center;">
                                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: bold;">
                                    🎁 SEU PRESENTE ESPECIAL
                                </p>
                                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                                        Cupom de Desconto:
                                    </p>
                                    <p style="margin: 0 0 10px 0; color: #d4af37; font-size: 32px; font-weight: bold; letter-spacing: 3px;">
                                        ${data.couponCode}
                                    </p>
                                    <p style="margin: 0; color: #d4af37; font-size: 24px; font-weight: bold;">
                                        ${data.discountValue}% OFF
                                    </p>
                                </div>
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    Válido até: <strong>${data.expiresAt}</strong>
                                </p>
                            </div>

                            <p style="color: #666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; text-align: center;">
                                ✨ Use no seu próximo agendamento e aproveite!
                            </p>

                            <div style="text-align: center;">
                                <a href="${SITE_URL}" 
                                   style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);">
                                    🎉 AGENDAR AGORA
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fffbeb; border-radius: 0 0 12px 12px; text-align: center;">
                            <p style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">
                                Com muito carinho, ❤️
                            </p>
                            <p style="color: #92400e; font-size: 18px; font-weight: bold; margin: 0;">
                                Equipe Henrique Bilro 💕
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

// Função auxiliar para gerar token simples
function generateToken(appointmentId: string): string {
    return Buffer.from(`${appointmentId}:${Date.now()}`).toString('base64')
}