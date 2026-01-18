// app/api/admin/quick-stats/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ✅ Função para calcular preço
function getAppointmentPrice(apt: any): number {
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

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // 1️⃣ Agendamentos de HOJE (todos os status)
        const todayAppointments = await prisma.appointment.count({
            where: {
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        })

        // 2️⃣ Serviços ATIVOS
        const activeServices = await prisma.service.count({
            where: {
                active: true
            }
        })

        // 3️⃣ Receita do MÊS (apenas COMPLETED)
        const monthAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: monthStart,
                    lte: monthEnd
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

        const monthRevenue = monthAppointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0)

        // 4️⃣ Total de CLIENTES
        const totalClients = await prisma.user.count({
            where: {
                role: 'CLIENT'
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                todayAppointments,
                activeServices,
                monthRevenue,
                totalClients
            }
        })
    } catch (error) {
        console.error('Erro ao buscar estatísticas rápidas:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao buscar estatísticas' },
            { status: 500 }
        )
    }
}