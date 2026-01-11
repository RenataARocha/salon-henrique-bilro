// src/app/api/check-blocked-date/route.ts
// API para verificar se uma data está bloqueada

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { date } = await request.json()

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Data não fornecida' },
                { status: 400 }
            )
        }

        const checkDate = new Date(date)
        const dayOfWeek = checkDate.getDay()

        const dateStart = new Date(checkDate)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(checkDate)
        dateEnd.setHours(23, 59, 59, 999)

        // Buscar bloqueios que afetam esta data
        const blockedTimes = await prisma.blockedTime.findMany({
            where: {
                OR: [
                    // Bloqueios recorrentes para este dia da semana
                    {
                        isRecurring: true,
                        dayOfWeek: dayOfWeek,
                        OR: [
                            // Sem período de validade (sempre ativo)
                            {
                                AND: [
                                    { startDate: null },
                                    { endDate: null }
                                ]
                            },
                            // Dentro do período de validade
                            {
                                AND: [
                                    {
                                        OR: [
                                            { startDate: null },
                                            { startDate: { lte: checkDate } }
                                        ]
                                    },
                                    {
                                        OR: [
                                            { endDate: null },
                                            { endDate: { gte: checkDate } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    // Bloqueios pontuais para esta data específica
                    {
                        isRecurring: false,
                        date: {
                            gte: dateStart,
                            lte: dateEnd
                        }
                    }
                ]
            }
        })

        // Verificar se o dia todo está bloqueado
        const fullDayBlocked = blockedTimes.some(
            block => !block.startTime && !block.endTime
        )

        // Retornar informações sobre os bloqueios
        return NextResponse.json({
            success: true,
            data: {
                isBlocked: blockedTimes.length > 0,
                fullDayBlocked,
                blockedTimes: blockedTimes.map(block => ({
                    id: block.id,
                    type: block.type,
                    reason: block.reason,
                    startTime: block.startTime,
                    endTime: block.endTime,
                    isFullDay: !block.startTime && !block.endTime
                }))
            }
        })

    } catch (error) {
        console.error('❌ Erro ao verificar bloqueio:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao verificar bloqueio' },
            { status: 500 }
        )
    }
}