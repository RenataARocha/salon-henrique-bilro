// app/api/staff/reports/route.ts
// API de Relatórios - Dashboards e Exportação

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Gerar relatórios
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') // 'today', 'week', 'month', 'custom'
        const staffId = searchParams.get('staffId') // null = todos
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        type DateFilter = {
            gte?: Date
            lte?: Date
            lt?: Date
        }

        let dateFilter: DateFilter = {}

        // Definir período
        const now = new Date()

        switch (period) {
            case 'today':
                const today = new Date(now.setHours(0, 0, 0, 0))
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                dateFilter = { gte: today, lt: tomorrow }
                break

            case 'week':
                const weekStart = new Date(now)
                weekStart.setDate(now.getDate() - now.getDay()) // Domingo
                weekStart.setHours(0, 0, 0, 0)
                dateFilter = { gte: weekStart }
                break

            case 'fortnight':
                const fortnightStart = new Date(now)
                fortnightStart.setDate(now.getDate() - 14)
                fortnightStart.setHours(0, 0, 0, 0)
                dateFilter = { gte: fortnightStart }
                break

            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                dateFilter = { gte: monthStart }
                break

            case 'custom':
                if (startDate && endDate) {
                    dateFilter = {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                }
                break

            default:
                // Mês atual por padrão
                const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
                dateFilter = { gte: defaultStart }
        }

        type StaffServiceWhere = {
            executedAt: DateFilter
            staffId?: string
        }

        const where: StaffServiceWhere = {
            executedAt: dateFilter
        }

        if (staffId) {
            where.staffId = staffId
        }

        // Buscar serviços do período
        const services = await prisma.staffService.findMany({
            where,
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        photo: true,
                        commissionPercent: true
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                combo: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                executedAt: 'desc'
            }
        })

        // Agrupar por funcionário
        type StaffReport = {
            staff: {
                id: string
                name: string | null
                photo: string | null
                commissionPercent: number
            }
            totalServices: number
            totalRevenue: number
            totalCommission: number
            commissionPaid: number
            commissionPending: number
            services: typeof services
        }

        type StaffReportsMap = Record<string, StaffReport>

        const staffReports = services.reduce((acc: StaffReportsMap, service) => {
            const staffId = service.staff.id

            if (!acc[staffId]) {
                acc[staffId] = {
                    staff: service.staff,
                    totalServices: 0,
                    totalRevenue: 0,
                    totalCommission: 0,
                    commissionPaid: 0,
                    commissionPending: 0,
                    services: [] as typeof services
                }
            }

            acc[staffId].totalServices += 1
            acc[staffId].totalRevenue += service.serviceValue
            acc[staffId].totalCommission += service.commissionValue

            if (service.commissionPaid) {
                acc[staffId].commissionPaid += service.commissionValue
            } else {
                acc[staffId].commissionPending += service.commissionValue
            }

            acc[staffId].services.push(service)

            return acc
        }, {})

        // Converter para array e ordenar por faturamento
        const reportArray = Object.values(staffReports).sort((a: StaffReport, b: StaffReport) =>
            b.totalRevenue - a.totalRevenue
        )

        // Totais gerais
        type Totals = {
            totalServices: number
            totalRevenue: number
            totalCommission: number
            commissionPaid: number
            commissionPending: number
        }

        const totals = reportArray.reduce((acc: Totals, report: StaffReport) => {
            acc.totalServices += report.totalServices
            acc.totalRevenue += report.totalRevenue
            acc.totalCommission += report.totalCommission
            acc.commissionPaid += report.commissionPaid
            acc.commissionPending += report.commissionPending
            return acc
        }, {
            totalServices: 0,
            totalRevenue: 0,
            totalCommission: 0,
            commissionPaid: 0,
            commissionPending: 0
        })

        return NextResponse.json({
            success: true,
            data: reportArray,
            totals,
            period: {
                type: period,
                startDate: dateFilter.gte,
                endDate: dateFilter.lte || dateFilter.lt || new Date()
            }
        })

    } catch (error: unknown) {
        console.error('Erro ao gerar relatório:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao gerar relatório' },
            { status: 500 }
        )
    }
}

// POST - Marcar relatório mensal como pago
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { staffId, year, month, paymentNotes } = body

        if (!staffId || !year || !month) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // Atualizar relatório
        const report = await prisma.staffMonthlyReport.update({
            where: {
                staffId_year_month: {
                    staffId,
                    year,
                    month
                }
            },
            data: {
                paid: true,
                paidAt: new Date(),
                paymentNotes: paymentNotes || null
            }
        })

        // Marcar todos os serviços do mês como pagos
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        await prisma.staffService.updateMany({
            where: {
                staffId,
                executedAt: {
                    gte: startDate,
                    lte: endDate
                },
                commissionPaid: false
            },
            data: {
                commissionPaid: true,
                paidAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: report,
            message: 'Comissões marcadas como pagas!'
        })

    } catch (error: unknown) {
        console.error('Erro ao marcar como pago:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao processar pagamento' },
            { status: 500 }
        )
    }
}