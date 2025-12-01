// app/api/auth/forgot-password/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email é obrigatório' },
                { status: 400 }
            )
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        // IMPORTANTE: Sempre retornar sucesso (segurança)
        // Não revelar se o email existe ou não
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
            })
        }

        // Invalidar tokens anteriores deste usuário
        await prisma.passwordReset.updateMany({
            where: {
                userId: user.id,
                used: false,
                expiresAt: {
                    gt: new Date()
                }
            },
            data: {
                used: true
            }
        })

        // Gerar token único
        const token = crypto.randomBytes(32).toString('hex')

        // Criar registro de reset (válido por 1 hora)
        await prisma.passwordReset.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
            }
        })

        // URL de reset
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

        // TODO: Enviar email real (por enquanto, apenas loga)
        console.log('='.repeat(60))
        console.log('🔐 RESET DE SENHA')
        console.log('='.repeat(60))
        console.log(`Email: ${user.email}`)
        console.log(`Nome: ${user.name}`)
        console.log(`Link: ${resetUrl}`)
        console.log(`Token: ${token}`)
        console.log(`Expira em: 1 hora`)
        console.log('='.repeat(60))

        // AQUI você integraria com serviço de email:
        // - Resend
        // - SendGrid
        // - AWS SES
        // - Nodemailer

        /*
        Exemplo com Resend:
        
        await resend.emails.send({
            from: 'Henrique Bilro <noreply@henriquebilro.com>',
            to: user.email,
            subject: 'Redefinir sua senha',
            html: `
                <h1>Olá, ${user.name}!</h1>
                <p>Recebemos uma solicitação para redefinir sua senha.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>Este link expira em 1 hora.</p>
                <p>Se você não solicitou isso, ignore este email.</p>
            `
        })
        */

        return NextResponse.json({
            success: true,
            message: 'Se o email existir, você receberá instruções para redefinir sua senha.',
            // REMOVER ISSO EM PRODUÇÃO (apenas para desenvolvimento):
            devOnly: {
                resetUrl,
                token
            }
        })

    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}