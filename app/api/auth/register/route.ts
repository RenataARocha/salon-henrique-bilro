// app/api/auth/register/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { notifyNewCoupon, notifyNewCombo, notifyBirthdayCoupon } from '@/lib/notifications'

export async function POST(request: Request) {
    console.log('🚀 [REGISTER] Iniciando registro...')

    try {
        let body
        try {
            body = await request.json()
            console.log('📦 [REGISTER] Body recebido:', {
                email: body.email,
                name: body.name,
                hasPassword: !!body.password,
                hasPhone: !!body.phone,
                hasBirthDate: !!body.birthDate
            })
        } catch (error) {
            console.error('❌ [REGISTER] Erro ao fazer parse do body:', error)
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            )
        }

        const { name, email, password, phone, birthDate } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'A senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Este email já está cadastrado' },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        let birthDateFormatted = null
        if (birthDate) {
            try {
                birthDateFormatted = new Date(birthDate + 'T00:00:00.000Z')
            } catch (error) {
                console.error('⚠️ [REGISTER] Erro ao processar data:', error)
            }
        }

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                birthDate: birthDateFormatted,
                role: 'CLIENT'
            }
        })

        console.log('✅ [REGISTER] Usuário criado:', user.email)

        // ============================================
        // NOTIFICAÇÕES DE BOAS-VINDAS
        // ============================================
        try {
            // 1. Cupom ativo mais recente
            if (user.phone) {
                const cupomAtivo = await prisma.coupon.findFirst({
                    where: {
                        active: true,
                        validUntil: { gte: new Date() },
                        NOT: { code: { startsWith: 'ANIVERSARIO-' } }
                    },
                    orderBy: { createdAt: 'desc' }
                })

                if (cupomAtivo) {
                    await notifyNewCoupon(cupomAtivo, user)
                    console.log('✅ Cupom enviado para nova cliente')
                }

                // 2. Combo em destaque
                const comboDestaque = await prisma.serviceCombo.findFirst({
                    where: { active: true, featured: true },
                    include: {
                        services: { include: { service: true } }
                    }
                })

                if (comboDestaque) {
                    const services = comboDestaque.services.map(cs => cs.service)
                    const originalPrice = services.reduce((sum, s) => sum + s.price, 0)
                    const comboPrice = originalPrice * (1 - comboDestaque.discountPercent / 100)

                    await notifyNewCombo({
                        ...comboDestaque,
                        services,
                        originalPrice,
                        comboPrice
                    }, user)
                    console.log('✅ Combo enviado para nova cliente')
                }
            }

            // 3. Aniversariante do mês
            if (user.birthDate) {
                const hoje = new Date()
                const nascimento = new Date(user.birthDate)

                if (nascimento.getMonth() === hoje.getMonth()) {
                    const firstName = user.name.split(' ')[0].toUpperCase()
                    const couponCode = `ANIVERSARIO-${firstName}-${hoje.getFullYear()}`

                    // Verificar se já existe
                    const existing = await prisma.coupon.findUnique({
                        where: { code: couponCode }
                    })

                    if (!existing) {
                        const couponAniversario = await prisma.coupon.create({
                            data: {
                                code: couponCode,
                                description: `Cupom de aniversário para ${user.name}`,
                                discountType: 'PERCENTAGE',
                                discountValue: 20,
                                validFrom: new Date(),
                                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                active: true,
                                maxUses: 1,
                                usedCount: 0,
                                applicableServices: []
                            }
                        })

                        await notifyBirthdayCoupon(user, {
                            ...couponAniversario,
                            expiresAt: couponAniversario.validUntil
                        })
                        console.log('✅ Cupom de aniversário enviado para nova cliente')
                    }
                }
            }
        } catch (notificationError) {
            console.error('⚠️ Erro nas notificações de boas-vindas:', notificationError)
            // NÃO bloqueia o cadastro
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            message: 'Cadastro realizado com sucesso!'
        })

    } catch (error: any) {
        console.error('❌ [REGISTER] ERRO FATAL:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao criar conta. Tente novamente.',
                details: error.message
            },
            { status: 500 }
        )
    }
}