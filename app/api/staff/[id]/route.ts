// app/api/staff/[id]/route.ts
// API de Detalhes do Funcionário

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar detalhes completos do funcionário
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        // Buscar funcionário
        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        services: true,
                        monthlyReports: true
                    }
                }
            }
        })

        if (!staff) {
            return NextResponse.json(
                { success: false, error: 'Funcionário não encontrado' },
                { status: 404 }
            )
        }

        // Buscar últimos serviços
        const recentServices = await prisma.staffService.findMany({
            where: { staffId: id },
            include: {
                service: {
                    select: {
                        name: true
                    }
                },
                combo: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                executedAt: 'desc'
            },
            take: 10
        })

        // Estatísticas do mês atual
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const monthStats = await prisma.staffService.aggregate({
            where: {
                staffId: id,
                executedAt: {
                    gte: monthStart
                }
            },
            _sum: {
                serviceValue: true,
                commissionValue: true
            },
            _count: true
        })

        // Estatísticas totais
        const totalStats = await prisma.staffService.aggregate({
            where: { staffId: id },
            _sum: {
                serviceValue: true,
                commissionValue: true
            },
            _count: true
        })

        // Relatórios mensais
        const monthlyReports = await prisma.staffMonthlyReport.findMany({
            where: { staffId: id },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ],
            take: 6 // Últimos 6 meses
        })

        return NextResponse.json({
            success: true,
            data: {
                staff,
                recentServices,
                stats: {
                    month: {
                        services: monthStats._count || 0,
                        revenue: monthStats._sum.serviceValue || 0,
                        commission: monthStats._sum.commissionValue || 0
                    },
                    total: {
                        services: totalStats._count || 0,
                        revenue: totalStats._sum.serviceValue || 0,
                        commission: totalStats._sum.commissionValue || 0
                    }
                },
                monthlyReports
            }
        })

    } catch (error) {
        console.error('Erro ao buscar detalhes:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar detalhes' },
            { status: 500 }
        )
    }
}