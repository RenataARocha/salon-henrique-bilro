// src/lib/email.ts

import { Resend } from 'resend'
import { passwordResetEmailTemplate, passwordResetTextTemplate } from './email-templates'

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendPasswordResetEmailParams {
    to: string
    name: string
    resetUrl: string
}

export async function sendPasswordResetEmail({
    to,
    name,
    resetUrl
}: SendPasswordResetEmailParams) {
    try {
        // Email HTML
        const html = passwordResetEmailTemplate(name, resetUrl)

        // Email texto puro (fallback)
        const text = passwordResetTextTemplate(name, resetUrl)

        // Enviar email
        const data = await resend.emails.send({
            from: 'Henrique Bilro <noreply@henriquebilro.com>',
            to: to,
            subject: 'Redefinir sua senha - Henrique Bilro Cabeleireiros',
            html: html,
            text: text,
            // Tags para rastreamento (opcional)
            tags: [
                {
                    name: 'category',
                    value: 'password_reset'
                }
            ]
        })

        console.log('✅ Email enviado com sucesso:', data.id)
        return { success: true, data }

    } catch (error) {
        console.error('❌ Erro ao enviar email:', error)
        return { success: false, error }
    }
}

// Outras funções de email que você pode adicionar depois:

export async function sendWelcomeEmail(to: string, name: string) {
    // TODO: Email de boas-vindas
}

export async function sendAppointmentConfirmation(to: string, appointmentDetails: any) {
    // TODO: Email de confirmação de agendamento
}

export async function sendAppointmentReminder(to: string, appointmentDetails: any) {
    // TODO: Email de lembrete 24h antes
}

export async function sendAppointmentCancellation(to: string, appointmentDetails: any) {
    // TODO: Email de cancelamento
}