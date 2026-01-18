import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar combos FEATURED e ativos (público)
export async function GET(request: NextRequest) {
    try {
        const combos = await prisma.serviceCombo.findMany({
            where: {
                active: true,
                featured: true  // ✅ Apenas combos featured
            },
            include: {
                services: {
                    include: {
                        service: true  // ✅ Incluir todos, filtrar depois
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        console.log(`🎁 Combos FEATURED encontrados: ${combos.length}`)

        const formattedCombos = combos.map(combo => {
            // ✅ Filtrar apenas serviços ativos DEPOIS da query
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
                comboPrice,
                createdAt: combo.createdAt,
                updatedAt: combo.updatedAt
            }
        })

        // ✅ Headers anti-cache
        const response = NextResponse.json({
            success: true,
            data: formattedCombos
        })

        response.headers.set('Cache-Control', 'no-store, must-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')

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