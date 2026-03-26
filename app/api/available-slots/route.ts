// app/api/available-slots/route.ts - VERSÃO FINAL COM FERIADOS

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isHoliday } from '@/lib/holidays' // ← ADICIONAR IMPORT

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

        const selectedDate = new Date(dateParam + 'T00:00:00') // ← FIX: Garantir timezone correto
        const dayOfWeek = selectedDate.getDay()

        // 🎉 NOVO: Verificar se é feriado
        const holiday = isHoliday(selectedDate)
        if (holiday) {
            return NextResponse.json({
                success: true,
                data: [],
                message: `🎉 Feriado: ${holiday.name} - Salão fechado`,
                isHoliday: true,
                holidayName: holiday.name
            })
        }

        // 1️⃣ Buscar bloqueios que afetam esta data
        const dateStart = new Date(selectedDate)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(selectedDate)
        dateEnd.setHours(23, 59, 59, 999)

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
                                    {
                                        OR: [
                                            { startDate: null },
                                            { startDate: { lte: selectedDate } }
                                        ]
                                    },
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
                            gte: dateStart,
                            lte: dateEnd
                        }
                    }
                ]
            }
        })

        // 2️⃣ Verificar se o dia inteiro está bloqueado
        const fullDayBlock = blockedTimes.find(block => !block.startTime && !block.endTime)
        if (fullDayBlock) {
            return NextResponse.json({
                success: true,
                data: [],
                message: fullDayBlock.reason || 'Este dia não está disponível para agendamentos',
                isBlocked: true,
                blockReason: fullDayBlock.reason
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
                message: 'Nenhum horário configurado para este dia da semana'
            })
        }

        // 4️⃣ Buscar agendamentos já marcados para esta data
        const bookedAppointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: dateStart,
                    lte: dateEnd
                },
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            },
            select: {
                time: true
            }
        })

        const bookedTimes = bookedAppointments
            .map(apt => apt.time)
            .filter(Boolean) // remove undefined/null

        // 5️⃣ Verificar se a data selecionada já passou
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const checkDate = new Date(selectedDate)
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

                return !isTimeBlocked
            })

        // 7️⃣ Se for hoje, filtrar horários que já passaram

        if (checkDate.getTime() === today.getTime()) {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()

            availableTimes = availableTimes.filter(time => {
                if (!time) return false // ← proteção extra

                const [hour, minute] = time.split(':').map(n => Number(n))
                if (isNaN(hour) || isNaN(minute)) return false // ← evita NaN

                return (hour > currentHour) || (hour === currentHour && minute > currentMinute)
            })
        }

        return NextResponse.json({
            success: true,
            data: availableTimes,
            message: availableTimes.length > 0
                ? `${availableTimes.length} horários disponíveis`
                : 'Nenhum horário disponível para esta data',
            blockedRanges: blockedTimes
                .filter(b => b.startTime || b.endTime)
                .map(b => ({
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