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
        } catch (error) {
            return NextResponse.json({ success: false, error: 'Dados inválidos' }, { status: 400 })
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

        const emailNormalized = email.toLowerCase().trim()
        const phoneNormalized = phone ? phone.trim() : null

        // ── Verifica email já cadastrado (com email real) ──────────────────
        const existingByEmail = await prisma.user.findUnique({
            where: { email: emailNormalized }
        })

        // Se já existe com email real (não temporário), bloqueia
        if (existingByEmail && !existingByEmail.email.includes('@cliente.salao')) {
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

        let user

        // ── Verifica pré-cadastro por telefone ─────────────────────────────
        // Rosie pode ter criado um agendamento com o telefone da cliente
        const preCadastro = phoneNormalized
            ? await prisma.user.findFirst({
                where: {
                    phone: phoneNormalized,
                    email: { contains: '@cliente.salao' } // email temporário gerado pelo sistema
                }
            })
            : null

        if (preCadastro) {
            // ✅ Encontrou pré-cadastro — atualiza com os dados reais da cliente
            console.log('🔄 [REGISTER] Pré-cadastro encontrado, atualizando...')
            user = await prisma.user.update({
                where: { id: preCadastro.id },
                data: {
                    name: name.trim(),
                    email: emailNormalized,
                    password: hashedPassword,
                    phone: phoneNormalized,
                    birthDate: birthDateFormatted ?? preCadastro.birthDate,
                }
            })
            console.log('✅ [REGISTER] Pré-cadastro atualizado:', user.email)
        } else {
            // ✅ Novo cadastro normal
            user = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email: emailNormalized,
                    password: hashedPassword,
                    phone: phoneNormalized,
                    birthDate: birthDateFormatted,
                    role: 'CLIENT'
                }
            })
            console.log('✅ [REGISTER] Novo usuário criado:', user.email)
        }

        // ── Notificações de boas-vindas ────────────────────────────────────
        try {
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
                }

                const comboDestaque = await prisma.serviceCombo.findFirst({
                    where: { active: true, featured: true },
                    include: { services: { include: { service: true } } }
                })
                if (comboDestaque) {
                    const services = comboDestaque.services.map(cs => cs.service)
                    const originalPrice = services.reduce((sum, s) => sum + s.price, 0)
                    const comboPrice = originalPrice * (1 - comboDestaque.discountPercent / 100)
                    await notifyNewCombo({ ...comboDestaque, services, originalPrice, comboPrice }, user)
                }
            }

            if (user.birthDate) {
                const hoje = new Date()
                const nascimento = new Date(user.birthDate)
                if (nascimento.getMonth() === hoje.getMonth()) {
                    const firstName = user.name.split(' ')[0].toUpperCase()
                    const couponCode = `ANIVERSARIO-${firstName}-${hoje.getFullYear()}`
                    const existing = await prisma.coupon.findUnique({ where: { code: couponCode } })
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
                        await notifyBirthdayCoupon(user, { ...couponAniversario, expiresAt: couponAniversario.validUntil })
                    }
                }
            }
        } catch (notificationError) {
            console.error('⚠️ Erro nas notificações de boas-vindas:', notificationError)
        }

        return NextResponse.json({
            success: true,
            data: { id: user.id, name: user.name, email: user.email, role: user.role },
            message: preCadastro
                ? 'Cadastro completado! Seus agendamentos já estão disponíveis.'
                : 'Cadastro realizado com sucesso!'
        })

    } catch (error: any) {
        console.error('❌ [REGISTER] ERRO FATAL:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar conta. Tente novamente.', details: error.message },
            { status: 500 }
        )
    }
}