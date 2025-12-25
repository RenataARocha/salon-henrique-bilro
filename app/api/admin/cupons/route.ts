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

        // Validações
        if (!code || !description || !discountType || !discountValue || !validFrom || !validUntil) {
            return NextResponse.json(
                { success: false, message: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        // Verificar se código já existe
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
                active: true
            }
        })

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
                message: 'Erro ao criar cupom'
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