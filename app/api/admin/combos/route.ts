// app/api/admin/combos/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewCombo } from '@/lib/notifications'

// GET - Listar TODOS os combos (admin)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const combos = await prisma.serviceCombo.findMany({
            // ✅ SEM FILTRO - Retorna todos os combos para admin
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

        console.log(`📊 Admin: Total de combos: ${combos.length}`)

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
                active: combo.active,
                featured: combo.featured || false,  // ✅ Garantir boolean
                discountPercent: combo.discountPercent,
                services: activeServices,
                originalPrice,
                comboPrice,
                createdAt: combo.createdAt,
                updatedAt: combo.updatedAt
            }
        })

        const response = NextResponse.json({
            success: true,
            data: formattedCombos
        })

        // ✅ Sem cache para admin
        response.headers.set('Cache-Control', 'no-store')

        return response

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

        const combo = await prisma.serviceCombo.create({
            data: {
                name,
                description,
                discountPercent,
                active: true,
                featured: false,  // ✅ Novo combo começa sem destaque
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

        try {
            const services = combo.services.map(cs => cs.service)
            const originalPrice = services.reduce((sum, s) => sum + s.price, 0)
            const comboPrice = originalPrice * (1 - combo.discountPercent / 100)

            await notifyNewCombo({
                ...combo,
                services,
                originalPrice,
                comboPrice
            })
            console.log('✅ Notificações de combo enviadas!')
        } catch (notificationError) {
            console.error('⚠️ Erro ao enviar notificações:', notificationError)
        }

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