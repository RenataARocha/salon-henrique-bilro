// app/api/cupons/route.ts

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

        // ✅ CORRIGIDO: prisma.coupon (não cupom)
        const coupons = await prisma.coupon.findMany({
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

        return NextResponse.json({
            success: true,
            data: coupons
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
            applicableServices
        } = body

        console.log('📦 Dados recebidos:', body)

        // Validações
        if (!code || !description || !discountType || !discountValue || !validFrom || !validUntil) {
            return NextResponse.json(
                { success: false, message: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        // ✅ CORRIGIDO: prisma.coupon.findUnique
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        })

        if (existingCoupon) {
            return NextResponse.json(
                { success: false, message: 'Já existe um cupom com este código' },
                { status: 400 }
            )
        }

        // ✅ CORRIGIDO: prisma.coupon.create
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
                active: true
            }
        })

        console.log('✅ Cupom criado:', coupon)

        return NextResponse.json({
            success: true,
            data: coupon,
            message: 'Cupom criado com sucesso!'
        })

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
        const {
            code,
            description,
            discountType,
            discountValue,
            minValue,
            maxUses,
            validFrom,
            validUntil,
            applicableServices
        } = body

        // ✅ CORRIGIDO: prisma.coupon.update
        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                code: code.toUpperCase(),
                description,
                discountType,
                discountValue: parseFloat(discountValue),
                minValue: minValue ? parseFloat(minValue) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
                validFrom: new Date(validFrom),
                validUntil: new Date(validUntil),
                applicableServices: applicableServices || []
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

// DELETE - Deletar cupom
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

        // ✅ CORRIGIDO: prisma.coupon.delete
        await prisma.coupon.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Cupom deletado com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao deletar cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao deletar cupom'
            },
            { status: 500 }
        )
    }
}