// app/api/auth/forgot-password/route.ts - COM FALLBACK PARA PRODUÇÃO

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ADMIN_CREDENTIALS } from '@/lib/admin-auth'
import crypto from 'crypto'

// Importar funções com try/catch para evitar erro em produção
let queuePasswordResetEmail: any = null
let checkRateLimit: any = null
let sendPasswordResetEmail: any = null

// Tentar importar (funciona local, falha na Vercel)
try {
    const emailQueue = require('@/lib/email/emailQueue')
    queuePasswordResetEmail = emailQueue.queuePasswordResetEmail
} catch (e) {
    console.log('⚠️ Fila de emails não disponível (modo produção)')
}

try {
    const redis = require('@/lib/redis')
    checkRateLimit = redis.checkRateLimit
} catch (e) {
    console.log('⚠️ Redis não disponível (modo produção)')
}

try {
    const resend = require('@/lib/email/resend')
    sendPasswordResetEmail = resend.sendPasswordResetEmail
} catch (e) {
    console.log('⚠️ Resend não disponível')
}

export async function POST(request: Request) {
    const startTime = Date.now()

    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email é obrigatório' },
                { status: 400 }
            )
        }

        const normalizedEmail = email.toLowerCase().trim()

        // ⛔ BLOQUEAR SE FOR EMAIL DO ADMIN
        if (normalizedEmail === ADMIN_CREDENTIALS.email.toLowerCase()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Recuperação de senha não disponível para administradores. Entre em contato com o suporte.'
                },
                { status: 403 }
            )
        }

        // ============================================
        // 1. RATE LIMITING (Apenas se Redis disponível)
        // ============================================
        if (checkRateLimit) {
            const rateLimitKey = `forgot-password:${normalizedEmail}`
            const { allowed, remaining } = await checkRateLimit(
                rateLimitKey,
                3,
                300
            )

            if (!allowed) {
                console.warn(`⚠️ Rate limit atingido para: ${normalizedEmail}`)
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Muitas tentativas. Tente novamente em alguns minutos.',
                    },
                    { status: 429 }
                )
            }

            console.log(`🔍 Buscando usuário: ${normalizedEmail} (${remaining} tentativas restantes)`)
        } else {
            console.log(`🔍 Buscando usuário: ${normalizedEmail} (rate limit desabilitado)`)
        }

        // ============================================
        // 2. BUSCAR USUÁRIO
        // ============================================
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, name: true, email: true },
        })

        const responseMessage = 'Se o email existir, você receberá instruções para redefinir sua senha.'

        if (!user) {
            const responseTime = Date.now() - startTime
            console.log(`⚠️ Email não encontrado: ${normalizedEmail} (${responseTime}ms)`)
            await new Promise(resolve => setTimeout(resolve, 500))

            return NextResponse.json({
                success: true,
                message: responseMessage
            })
        }

        // ============================================
        // 3. INVALIDAR TOKENS ANTERIORES
        // ============================================
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

        // ============================================
        // 4. GERAR NOVO TOKEN
        // ============================================
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        await prisma.passwordReset.create({
            data: {
                token,
                userId: user.id,
                expiresAt
            }
        })

        console.log(`🔑 Token gerado para ${normalizedEmail}`)

        // ============================================
        // 5. ENVIAR EMAIL (Fila ou Direto)
        // ============================================
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

        // TENTAR USAR FILA (local), FALLBACK PARA ENVIO DIRETO (produção)
        if (queuePasswordResetEmail) {
            // Ambiente local com Redis
            console.log('📬 Usando fila de emails (modo local)')
            queuePasswordResetEmail({
                email: user.email,
                resetUrl,
                userName: user.name,
            }).catch((error: any) => {
                console.error('❌ Erro ao adicionar email à fila:', error)
            })
        } else if (sendPasswordResetEmail) {
            // Ambiente produção sem Redis - envio direto
            console.log('📧 Enviando email direto (modo produção)')
            try {
                await sendPasswordResetEmail({
                    to: user.email,
                    resetUrl,
                    userName: user.name,
                })
                console.log('✅ Email enviado com sucesso')
            } catch (error) {
                console.error('❌ Erro ao enviar email:', error)
                // Não falhar a requisição por causa do email
            }
        } else {
            console.warn('⚠️ Nenhum método de envio de email disponível')
        }

        const totalTime = Date.now() - startTime
        console.log(`✅ Solicitação processada em ${totalTime}ms para ${normalizedEmail}`)

        // ============================================
        // 6. LOG DE DESENVOLVIMENTO
        // ============================================
        if (process.env.NODE_ENV === 'development') {
            console.log('='.repeat(60))
            console.log('🔐 RESET DE SENHA (DEV MODE)')
            console.log('='.repeat(60))
            console.log(`Email: ${user.email}`)
            console.log(`Nome: ${user.name}`)
            console.log(`Link: ${resetUrl}`)
            console.log(`Token: ${token}`)
            console.log(`Tempo total: ${totalTime}ms`)
            console.log('='.repeat(60))
        }

        // ============================================
        // 7. RETORNAR RESPOSTA
        // ============================================
        return NextResponse.json({
            success: true,
            message: responseMessage,
            ...(process.env.NODE_ENV === 'development' && {
                devOnly: {
                    resetUrl,
                    token,
                    note: 'Este link é apenas para desenvolvimento.',
                },
            }),
        })

    } catch (error: any) {
        const errorTime = Date.now() - startTime
        console.error(`❌ Erro em forgot-password (${errorTime}ms):`, error)

        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao processar solicitação',
            },
            { status: 500 }
        )
    }
}