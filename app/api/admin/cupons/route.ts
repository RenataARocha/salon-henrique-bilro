// app/api/admin/coupons/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        const where: any = {}

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
            isActive: coupon.active && coupon.validUntil >= now
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
                applicableServices: applicableServices || [],
                perUserLimit: perUserLimit || false,
                daysOfWeek: daysOfWeek || [],
                timeStart: timeStart || null,
                timeEnd: timeEnd || null,
                active: true
            }
        })

        console.log('✅ Cupom criado:', coupon)

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
                applicableServices: body.applicableServices || [],
                perUserLimit: body.perUserLimit || false,
                daysOfWeek: body.daysOfWeek || [],
                timeStart: body.timeStart || null,
                timeEnd: body.timeEnd || null,
                active: body.active !== undefined ? body.active : true
            }
        })

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

// DELETE - Desativar cupom
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

        // Desativar ao invés de deletar (manter histórico)
        const coupon = await prisma.coupon.update({
            where: { id },
            data: { active: false }
        })

        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Cupom desativado com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao desativar cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao desativar cupom'
            },
            { status: 500 }
        )
    }
}