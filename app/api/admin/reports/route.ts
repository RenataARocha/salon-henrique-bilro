// app/api/admin/reports/route.ts
// VERSÃO DE TESTE - Busca TODOS os agendamentos sem filtro de data

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
        const start = searchParams.get('start') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const end = searchParams.get('end') || new Date().toISOString().split('T')[0]

        console.log('📊 Gerando relatório:', { start, end })

        // ✅ BUSCAR TODOS OS AGENDAMENTOS (SEM FILTRO INICIAL)
        const allAppointments = await prisma.appointment.findMany({
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
                date: 'desc'
            }
        })

        console.log(`📅 TODOS os agendamentos no banco: ${allAppointments.length}`)

        // Mostrar as datas para debug
        allAppointments.slice(0, 5).forEach(apt => {
            console.log(`   - ${new Date(apt.date).toLocaleDateString('pt-BR')} ${apt.time} - ${apt.status}`)
        })

        // ✅ Ajustar datas para incluir o dia completo
        const startDate = new Date(start + 'T00:00:00.000Z')
        const endDate = new Date(end + 'T23:59:59.999Z')

        console.log('📅 Período solicitado:', {
            start: startDate.toLocaleDateString('pt-BR'),
            end: endDate.toLocaleDateString('pt-BR')
        })

        // Filtrar manualmente por data
        const appointments = allAppointments.filter(apt => {
            const aptDate = new Date(apt.date)
            const inPeriod = aptDate >= startDate && aptDate <= endDate
            return inPeriod
        })

        console.log(`📅 Agendamentos NO PERÍODO: ${appointments.length}`)

        const statusCounts = {
            COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
            PENDING: appointments.filter(a => a.status === 'PENDING').length,
            CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
            CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
            NO_SHOW: appointments.filter(a => a.status === 'NO_SHOW').length
        }
        console.log('📊 Status dos agendamentos:', statusCounts)

        // Mostrar agendamentos FORA do período
        const outside = allAppointments.filter(apt => {
            const aptDate = new Date(apt.date)
            return aptDate < startDate || aptDate > endDate
        })
        if (outside.length > 0) {
            console.log(`⚠️ Agendamentos FORA do período: ${outside.length}`)
            outside.slice(0, 3).forEach(apt => {
                console.log(`   - ${new Date(apt.date).toLocaleDateString('pt-BR')} ${apt.time}`)
            })
        }

        // ✅ FUNÇÃO AUXILIAR PARA CALCULAR PREÇO
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

        // ========== RECEITA POR PERÍODO ==========
        const generatePeriodData = (periodType: 'daily' | 'weekly' | 'monthly') => {
            const revenueByPeriod: Record<string, { value: number; appointments: number }> = {}

            appointments.forEach(apt => {
                if (apt.status === 'COMPLETED') {
                    const date = new Date(apt.date)
                    let key = ''

                    if (periodType === 'daily') {
                        key = date.toISOString().split('T')[0]
                    } else if (periodType === 'weekly') {
                        const weekStart = new Date(date)
                        weekStart.setDate(date.getDate() - date.getDay())
                        key = `Semana ${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
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

            return Object.entries(revenueByPeriod).map(([key, data]) => ({
                [periodType === 'daily' ? 'date' : periodType === 'weekly' ? 'week' : 'month']: key,
                ...data
            }))
        }

        const dailyData = generatePeriodData('daily')
        const weeklyData = generatePeriodData('weekly')
        const monthlyData = generatePeriodData('monthly')

        // Calcular crescimento
        const currentPeriodRevenue = [...dailyData, ...weeklyData, ...monthlyData].reduce((sum, r) => sum + r.value, 0)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const previousPeriodStart = new Date(startDate)
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff)
        const previousPeriodEnd = new Date(startDate)
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1)

        const previousAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: previousPeriodStart,
                    lte: previousPeriodEnd
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

        // ========== HORÁRIOS DE PICO (TODOS OS AGENDAMENTOS) ==========
        const hourStats: Record<string, number> = {}

        appointments.forEach(apt => {
            const hour = apt.time.substring(0, 5)
            hourStats[hour] = (hourStats[hour] || 0) + 1
        })

        const totalAppointmentsForPeak = appointments.length

        const peakHours = Object.entries(hourStats)
            .map(([hour, count]) => ({
                hour,
                count,
                occupancy: totalAppointmentsForPeak > 0
                    ? Math.round((count / totalAppointmentsForPeak) * 100)
                    : 0
            }))
            .sort((a, b) => b.count - a.count)

        console.log(`⏰ Horários de pico: ${peakHours.length} horários únicos`)

        // ========== CANCELAMENTOS ==========
        const cancelledAppointments = appointments.filter(apt => apt.status === 'CANCELLED')
        const cancellationRate = appointments.length > 0 ? (cancelledAppointments.length / appointments.length) * 100 : 0

        console.log(`❌ Cancelamentos: ${cancelledAppointments.length} de ${appointments.length} (${cancellationRate.toFixed(1)}%)`)

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
                    gte: startDate,
                    lte: endDate
                },
                role: 'CLIENT'
            }
        })

        console.log('📊 Resumo final:', {
            totalRevenue: totalRevenue.toFixed(2),
            totalAppointments: appointments.length,
            completedAppointments: completedAppointments.length,
            avgTicket: avgTicket.toFixed(2),
            completionRate: completionRate.toFixed(1),
            newClients
        })

        return NextResponse.json({
            success: true,
            data: {
                revenue: {
                    daily: dailyData,
                    weekly: weeklyData,
                    monthly: monthlyData,
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
                    completedAppointments: completedAppointments.length,
                    avgTicket,
                    completionRate,
                    newClients
                }
            }
        })
    } catch (error) {
        console.error('❌ Erro ao gerar relatórios:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao gerar relatórios' },
            { status: 500 }
        )
    }
}