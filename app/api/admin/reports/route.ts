// app/api/admin/reports/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        const start = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const end = searchParams.get('end') || new Date().toISOString().split('T')[0]
        const period = searchParams.get('period') || 'monthly'

        // ✅ FUNÇÃO AUXILIAR PARA CALCULAR PREÇO (aceita any)
        const getAppointmentPrice = (apt: any): number => {
            if (apt.finalPrice) return apt.finalPrice

            if (apt.combo) {
                const originalPrice = apt.combo.services.reduce(
                    (sum: number, cs: any) => sum + cs.service.price,
                    0
                )
                return originalPrice * (1 - apt.combo.discountPercent / 100)
            }

            if (apt.service) return apt.service.price

            return 0
        }

        // ✅ FUNÇÃO AUXILIAR PARA PEGAR NOME DO SERVIÇO/COMBO
        const getAppointmentName = (apt: any): string => {
            return apt.combo?.name || apt.service?.name || 'Serviço não identificado'
        }

        // BUSCAR AGENDAMENTOS COM COMBO
        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: new Date(start),
                    lte: new Date(end)
                }
            },
            include: {
                service: true,
                user: true,
                combo: {
                    select: {
                        name: true,
                        discountPercent: true,
                        services: {
                            include: {
                                service: {
                                    select: {
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        // ========== RECEITA POR PERÍODO ==========
        const revenueByPeriod: Record<string, { value: number; appointments: number }> = {}

        appointments.forEach(apt => {
            if (apt.status === 'COMPLETED') {
                const date = new Date(apt.date)
                let key = ''

                if (period === 'daily') {
                    key = date.toISOString().split('T')[0]
                } else if (period === 'weekly') {
                    const weekNum = Math.ceil((date.getDate()) / 7)
                    key = `Semana ${weekNum} - ${date.toLocaleString('pt-BR', { month: 'short' })}`
                } else {
                    key = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                }

                if (!revenueByPeriod[key]) {
                    revenueByPeriod[key] = { value: 0, appointments: 0 }
                }

                revenueByPeriod[key].value += getAppointmentPrice(apt)
                revenueByPeriod[key].appointments += 1
            }
        })

        const revenueData = Object.entries(revenueByPeriod).map(([key, data]) => ({
            [period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month']: key,
            ...data
        }))

        // Calcular crescimento
        const currentPeriodRevenue = revenueData.reduce((sum, r) => sum + r.value, 0)
        const previousPeriodStart = new Date(start)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))

        const previousAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: previousPeriodStart,
                    lt: new Date(start)
                },
                status: 'COMPLETED'
            },
            include: {
                service: true,
                combo: {
                    select: {
                        discountPercent: true,
                        services: {
                            include: {
                                service: {
                                    select: {
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const previousRevenue = previousAppointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0)
        const growth = previousRevenue > 0 ? ((currentPeriodRevenue - previousRevenue) / previousRevenue) * 100 : 0

        // ========== SERVIÇOS MAIS VENDIDOS ==========
        const serviceStats: Record<string, { count: number; revenue: number }> = {}

        appointments.forEach(apt => {
            if (apt.status === 'COMPLETED') {
                const serviceName = getAppointmentName(apt)
                if (!serviceStats[serviceName]) {
                    serviceStats[serviceName] = { count: 0, revenue: 0 }
                }
                serviceStats[serviceName].count += 1
                serviceStats[serviceName].revenue += getAppointmentPrice(apt)
            }
        })

        const totalServiceRevenue = Object.values(serviceStats).reduce((sum, s) => sum + s.revenue, 0)

        const services = Object.entries(serviceStats)
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                revenue: stats.revenue,
                percentage: totalServiceRevenue > 0 ? (stats.revenue / totalServiceRevenue) * 100 : 0
            }))
            .sort((a, b) => b.revenue - a.revenue)

        // ========== HORÁRIOS DE PICO ==========
        const hourStats: Record<string, number> = {}
        const totalSlots = appointments.length

        appointments.forEach(apt => {
            const hour = apt.time.substring(0, 5)
            hourStats[hour] = (hourStats[hour] || 0) + 1
        })

        const peakHours = Object.entries(hourStats)
            .map(([hour, count]) => ({
                hour,
                count,
                occupancy: totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count)

        // ========== CANCELAMENTOS ==========
        const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED')
        const cancellationRate = appointments.length > 0 ? (cancelledAppointments.length / appointments.length) * 100 : 0

        const reasonStats: Record<string, number> = {}
        cancelledAppointments.forEach(apt => {
            const reason = apt.justification || 'Não informado'
            reasonStats[reason] = (reasonStats[reason] || 0) + 1
        })

        const byReason = Object.entries(reasonStats)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count)

        // ========== TOP CLIENTES ==========
        const clientStats: Record<string, { totalSpent: number; visits: number; name: string }> = {}

        appointments.forEach(apt => {
            if (apt.status === 'COMPLETED') {
                const userId = apt.userId
                if (!clientStats[userId]) {
                    clientStats[userId] = {
                        name: apt.user.name,
                        totalSpent: 0,
                        visits: 0
                    }
                }
                clientStats[userId].totalSpent += getAppointmentPrice(apt)
                clientStats[userId].visits += 1
            }
        })

        const topClients = Object.values(clientStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10)

        // ========== RESUMO ==========
        const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED')
        const totalRevenue = completedAppointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0)
        const avgTicket = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0
        const completionRate = appointments.length > 0 ? (completedAppointments.length / appointments.length) * 100 : 0

        // Novos clientes no período
        const newClients = await prisma.user.count({
            where: {
                createdAt: {
                    gte: new Date(start),
                    lte: new Date(end)
                },
                role: 'CLIENT'
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                revenue: {
                    daily: period === 'daily' ? revenueData : [],
                    weekly: period === 'weekly' ? revenueData : [],
                    monthly: period === 'monthly' ? revenueData : [],
                    total: currentPeriodRevenue,
                    growth
                },
                services,
                peakHours,
                cancellations: {
                    rate: cancellationRate,
                    total: cancelledAppointments.length,
                    byReason
                },
                topClients,
                summary: {
                    totalRevenue,
                    totalAppointments: appointments.length,
                    avgTicket,
                    completionRate,
                    newClients
                }
            }
        })
    } catch (error) {
        console.error('Erro ao gerar relatórios:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao gerar relatórios' },
            { status: 500 }
        )
    }
}