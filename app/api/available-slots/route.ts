// app/api/available-slots/route.ts - CORRIGIDO

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')

        if (!dateParam) {
            return NextResponse.json(
                { success: false, error: 'Data não fornecida' },
                { status: 400 }
            )
        }

        const selectedDate = new Date(dateParam)
        const dayOfWeek = selectedDate.getDay()

        // ✅ REMOVIDO: Verificação hardcoded de domingo
        // Agora usa os bloqueios do banco!

        // 1️⃣ Buscar bloqueios que afetam esta data
        const blockedTimes = await prisma.blockedTime.findMany({
            where: {
                OR: [
                    // Bloqueio recorrente deste dia da semana
                    {
                        isRecurring: true,
                        dayOfWeek,
                        OR: [
                            // Sem período de validade (vale para sempre)
                            {
                                AND: [
                                    { startDate: null },
                                    { endDate: null }
                                ]
                            },
                            // Dentro do período de validade
                            {
                                AND: [
                                    { startDate: { lte: selectedDate } },
                                    {
                                        OR: [
                                            { endDate: null },
                                            { endDate: { gte: selectedDate } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    // Bloqueio pontual desta data específica
                    {
                        isRecurring: false,
                        date: {
                            gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
                            lte: new Date(selectedDate.setHours(23, 59, 59, 999))
                        }
                    }
                ]
            }
        })

        // 2️⃣ Verificar se o dia inteiro está bloqueado
        const isDayFullyBlocked = blockedTimes.some(block => {
            // Bloqueio sem horário específico = bloqueia o dia inteiro
            return !block.startTime && !block.endTime
        })

        if (isDayFullyBlocked) {
            const blockReason = blockedTimes.find(b => !b.startTime && !b.endTime)
            return NextResponse.json({
                success: true,
                data: [],
                message: blockReason?.reason || 'Este dia não está disponível para agendamentos'
            })
        }

        // 3️⃣ Buscar horários disponíveis para este dia da semana
        const availableSlots = await prisma.availableSlot.findMany({
            where: {
                dayOfWeek: dayOfWeek,
                active: true
            },
            orderBy: {
                timeSlot: 'asc'
            }
        })

        if (availableSlots.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Nenhum horário configurado para este dia'
            })
        }

        // 4️⃣ Buscar agendamentos já marcados para esta data
        const bookedAppointments = await prisma.appointment.findMany({
            where: {
                date: selectedDate,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            },
            select: {
                time: true
            }
        })

        const bookedTimes = bookedAppointments.map(apt => apt.time)

        // 5️⃣ Verificar se a data selecionada já passou
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const checkDate = new Date(dateParam)
        checkDate.setHours(0, 0, 0, 0)

        if (checkDate < today) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Não é possível agendar em datas passadas'
            })
        }

        // 6️⃣ Filtrar horários considerando bloqueios e agendamentos
        let availableTimes = availableSlots
            .map(slot => slot.timeSlot)
            .filter(time => {
                // Já está reservado?
                if (bookedTimes.includes(time)) {
                    return false
                }

                // Está bloqueado por horário específico?
                const isTimeBlocked = blockedTimes.some(block => {
                    // Se o bloqueio não tem horário específico, já foi tratado acima
                    if (!block.startTime && !block.endTime) {
                        return false
                    }

                    const blockStart = block.startTime || '00:00'
                    const blockEnd = block.endTime || '23:59'

                    // Verificar se o horário está dentro do range de bloqueio
                    return time >= blockStart && time <= blockEnd
                })

                if (isTimeBlocked) {
                    return false
                }

                return true
            })

        // 7️⃣ Se for hoje, filtrar horários que já passaram
        if (checkDate.getTime() === today.getTime()) {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()

            availableTimes = availableTimes.filter(time => {
                const [hour, minute] = time.split(':').map(Number)
                return (hour > currentHour) || (hour === currentHour && minute > currentMinute)
            })
        }

        return NextResponse.json({
            success: true,
            data: availableTimes,
            blockedRanges: blockedTimes.map(b => ({
                startTime: b.startTime,
                endTime: b.endTime,
                reason: b.reason
            }))
        })

    } catch (error) {
        console.error('Erro ao buscar horários:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar horários disponíveis' },
            { status: 500 }
        )
    }
}