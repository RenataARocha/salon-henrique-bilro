// app/api/admin/cupons/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewCoupon } from '@/lib/notifications'
import { Prisma } from '@prisma/client'


// GET - Listar todos os cupons
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const active = searchParams.get('active')
        const expired = searchParams.get('expired')

        const now = new Date()
        const where: Prisma.CouponWhereInput = {}

        if (active === 'true') {
            where.active = true
            where.validUntil = { gte: now }
        }

        if (expired === 'true') {
            where.validUntil = { lt: now }
        }

        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                _count: {
                    select: {
                        appointments: true
                    }
                }
            }
        })

        // Adicionar informações extras
        const couponsWithStats = coupons.map(coupon => ({
            ...coupon,
            usageCount: coupon._count.appointments,
            remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
            isExpired: coupon.validUntil < now,
            isActive: coupon.active && coupon.validUntil >= now,
            // ✅ IDENTIFICAR SE É CUPOM DE ANIVERSÁRIO
            isBirthdayCoupon: coupon.code.startsWith('ANIVERSARIO-')
        }))

        return NextResponse.json({
            success: true,
            data: couponsWithStats
        })

    } catch (error) {
        console.error('❌ Erro ao buscar cupons:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar cupons'
            },
            { status: 500 }
        )
    }
}

// POST - Criar novo cupom
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            code,
            description,
            discountType,
            discountValue,
            minValue,
            maxUses,
            validFrom,
            validUntil,
            applicableServices,
            perUserLimit,
            daysOfWeek,
            timeStart,
            timeEnd
        } = body

        console.log('📦 Dados recebidos:', body)

        // Validações
        if (!code || !description || !discountType || !discountValue || !validFrom || !validUntil) {
            return NextResponse.json(
                { success: false, message: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        // Verificar se já existe
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        })

        if (existingCoupon) {
            return NextResponse.json(
                { success: false, message: 'Já existe um cupom com este código' },
                { status: 400 }
            )
        }

        const servicesArray = Array.isArray(applicableServices) && applicableServices.length > 0
            ? applicableServices
            : []

        // Criar cupom
        // Criar cupom
        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                description,
                discountType,
                discountValue: parseFloat(discountValue),
                minValue: minValue ? parseFloat(minValue) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
                validFrom: new Date(validFrom),
                validUntil: new Date(validUntil),
                applicableServices: servicesArray,
                perUserLimit: perUserLimit || false,
                daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [],
                timeStart: timeStart || null,
                timeEnd: timeEnd || null,
                active: true
            }
        })

        // 👇 enviar notificações
        try {
            await notifyNewCoupon(coupon)
            console.log('✅ Notificações de cupom enviadas!')
        } catch (notificationError) {
            console.error('⚠️ Erro ao enviar notificações:', notificationError)
        }

        console.log('✅ Cupom criado:', coupon)

        // 👇 resposta da API
        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Cupom criado com sucesso!'
        }, { status: 201 })

    } catch (error) {
        console.error('❌ Erro ao criar cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao criar cupom: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
            },
            { status: 500 }
        )
    }
}

// PUT - Atualizar cupom
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID não fornecido' },
                { status: 400 }
            )
        }

        const body = await request.json()

        const servicesArray = Array.isArray(body.applicableServices) && body.applicableServices.length > 0
            ? body.applicableServices
            : []

        const daysArray = Array.isArray(body.daysOfWeek) ? body.daysOfWeek : []

        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                description: body.description,
                discountType: body.discountType,
                discountValue: parseFloat(body.discountValue),
                minValue: body.minValue ? parseFloat(body.minValue) : null,
                maxUses: body.maxUses ? parseInt(body.maxUses) : null,
                validFrom: new Date(body.validFrom),
                validUntil: new Date(body.validUntil),
                applicableServices: servicesArray,
                perUserLimit: body.perUserLimit || false,
                daysOfWeek: daysArray,
                timeStart: body.timeStart || null,
                timeEnd: body.timeEnd || null,
                active: body.active !== undefined ? body.active : true
            }
        })

        try {
            await notifyNewCoupon(coupon)
            console.log('✅ Notificações enviadas após edição!')
        } catch (err) {
            console.error('⚠️ Erro ao notificar:', err)
        }

        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Cupom atualizado com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao atualizar cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao atualizar cupom'
            },
            { status: 500 }
        )
    }
}

// ✅ DELETE - DELETAR PERMANENTEMENTE CUPONS DE ANIVERSÁRIO, DESATIVAR OS DEMAIS
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID não fornecido' },
                { status: 400 }
            )
        }

        // ✅ Buscar cupom para verificar se é de aniversário
        const coupon = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Cupom não encontrado' },
                { status: 404 }
            )
        }

        // ✅ SE FOR CUPOM DE ANIVERSÁRIO → DELETAR PERMANENTEMENTE
        if (coupon.code.startsWith('ANIVERSARIO-')) {
            await prisma.coupon.delete({
                where: { id }
            })

            return NextResponse.json({
                success: true,
                message: 'Cupom de aniversário excluído permanentemente!'
            })
        }

        // ✅ SE FOR CUPOM NORMAL → APENAS DESATIVAR
        const deactivatedCoupon = await prisma.coupon.update({
            where: { id },
            data: { active: false }
        })

        return NextResponse.json({
            success: true,
            data: deactivatedCoupon,
            message: 'Cupom desativado com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao processar cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao processar cupom'
            },
            { status: 500 }
        )
    }
}