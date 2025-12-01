// app/api/auth/forgot-password/route.ts - COM RESEND

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
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

        // Enviar email
        const emailResult = await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            resetUrl
        })

        if (!emailResult.success) {
            console.error('Falha ao enviar email, mas não revelar ao usuário')
            // Mesmo com falha no email, retornar sucesso por segurança
        }

        // Log no console (desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
            console.log('='.repeat(60))
            console.log('🔐 RESET DE SENHA (DEV MODE)')
            console.log('='.repeat(60))
            console.log(`Email: ${user.email}`)
            console.log(`Nome: ${user.name}`)
            console.log(`Link: ${resetUrl}`)
            console.log(`Token: ${token}`)
            console.log(`Email enviado: ${emailResult.success ? '✅ Sim' : '❌ Não'}`)
            console.log('='.repeat(60))
        }

        return NextResponse.json({
            success: true,
            message: 'Se o email existir, você receberá instruções para redefinir sua senha.',
            // REMOVER ISSO EM PRODUÇÃO (apenas para desenvolvimento):
            ...(process.env.NODE_ENV === 'development' && {
                devOnly: {
                    resetUrl,
                    token,
                    emailSent: emailResult.success
                }
            })
        })

    } catch (error) {
        console.error('Erro ao solicitar reset de senha:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}