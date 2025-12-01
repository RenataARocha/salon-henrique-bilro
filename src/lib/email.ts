// src/lib/email.ts

import { Resend } from 'resend'
import { passwordResetEmailTemplate, passwordResetTextTemplate } from './email-templates'

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
        console.log('='.repeat(60))
        console.log('📧 DEBUG - Envio de Email')
        console.log('='.repeat(60))
        console.log('Para:', to)
        console.log('API Key existe?', !!process.env.RESEND_API_KEY)
        console.log('API Key (primeiros 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10))

        const html = passwordResetEmailTemplate(name, resetUrl)
        const text = passwordResetTextTemplate(name, resetUrl)

        const data = await resend.emails.send({
            from: 'Henrique Bilro <onboarding@resend.dev>',
            to: to,
            subject: 'Redefinir sua senha - Henrique Bilro Cabeleireiros',
            html: html,
            text: text,
            tags: [{ name: 'category', value: 'password_reset' }]
        })

        console.log('✅ Resposta Resend:', JSON.stringify(data, null, 2))
        console.log('='.repeat(60))
        return { success: true, data }

    } catch (error: any) {
        console.error('='.repeat(60))
        console.error('❌ ERRO COMPLETO:')
        console.error('Mensagem:', error.message)
        console.error('Status:', error.statusCode)
        console.error('Erro completo:', JSON.stringify(error, null, 2))
        console.error('='.repeat(60))
        return { success: false, error }
    }
}