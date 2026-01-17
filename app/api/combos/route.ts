import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar combos ativos (público)
export async function GET(request: NextRequest) {
    try {
        const combos = await prisma.serviceCombo.findMany({
            where: {
                active: true
            },
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Filtrar serviços inativos DEPOIS da consulta
        const formattedCombos = combos.map(combo => {
            const activeServices = combo.services
                .map(cs => cs.service)
                .filter(s => s.active)

            const originalPrice = activeServices.reduce((sum, s) => sum + s.price, 0)
            const comboPrice = originalPrice * (1 - combo.discountPercent / 100)

            return {
                id: combo.id,
                name: combo.name,
                description: combo.description,
                discountPercent: combo.discountPercent,
                services: activeServices,
                originalPrice,
                comboPrice
            }
        })

        return NextResponse.json({
            success: true,
            data: formattedCombos
        })

    } catch (error) {
        console.error('❌ Erro ao buscar combos:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar combos',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// POST - Criar novo combo
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
        const { name, description, serviceIds, discountPercent } = body

        // Validações
        if (!name || !serviceIds || serviceIds.length < 2) {
            return NextResponse.json(
                { success: false, message: 'Informe nome e pelo menos 2 serviços' },
                { status: 400 }
            )
        }

        if (!discountPercent || discountPercent < 1 || discountPercent > 90) {
            return NextResponse.json(
                { success: false, message: 'Desconto deve estar entre 1% e 90%' },
                { status: 400 }
            )
        }

        // Criar combo
        const combo = await prisma.serviceCombo.create({
            data: {
                name,
                description,
                discountPercent,
                services: {
                    create: serviceIds.map((serviceId: string) => ({
                        serviceId
                    }))
                }
            },
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Combo criado com sucesso!',
            data: combo
        })

    } catch (error) {
        console.error('❌ Erro ao criar combo:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao criar combo',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}