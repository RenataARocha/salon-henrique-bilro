// src/app/api/calendar/month-status/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isHoliday as checkIsHoliday } from '@/lib/holidays'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const year = parseInt(searchParams.get('year') || '0')
        const month = parseInt(searchParams.get('month') || '0')

        if (!year || !month || month < 1 || month > 12) {
            return NextResponse.json(
                { success: false, error: 'Ano e mês inválidos' },
                { status: 400 }
            )
        }

        const firstDay = new Date(year, month - 1, 1)
        const lastDay = new Date(year, month, 0)

        const dateStart = new Date(firstDay)
        dateStart.setHours(0, 0, 0, 0)

        const dateEnd = new Date(lastDay)
        dateEnd.setHours(23, 59, 59, 999)

        // 🚀 1. BUSCAR TUDO DE UMA VEZ
        const [allSlots, allAppointments, allBlockedTimes] = await Promise.all([
            prisma.availableSlot.findMany({
                where: { active: true }
            }),

            prisma.appointment.findMany({
                where: {
                    date: {
                        gte: dateStart,
                        lte: dateEnd
                    },
                    status: { in: ['PENDING', 'CONFIRMED'] }
                }
            }),

            prisma.blockedTime.findMany()
        ])

        // 🧠 Agrupar slots por dia da semana
        const slotsByDay: Record<number, string[]> = {}

        allSlots.forEach(slot => {
            if (!slotsByDay[slot.dayOfWeek]) {
                slotsByDay[slot.dayOfWeek] = []
            }
            slotsByDay[slot.dayOfWeek].push(slot.timeSlot)
        })

        // 🧠 Agrupar agendamentos por data
        const appointmentsByDate: Record<string, number> = {}

        allAppointments.forEach(apt => {
            const key = new Date(apt.date).toISOString().split('T')[0]
            appointmentsByDate[key] = (appointmentsByDate[key] || 0) + 1
        })

        const days = []

        // 🚀 2. PROCESSAR EM MEMÓRIA (RÁPIDO)
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month - 1, day)
            const dateKey = date.toISOString().split('T')[0]
            const dayOfWeek = date.getDay()

            // 🔹 Feriado
            const holiday = checkIsHoliday(date)
            if (holiday) {
                days.push({
                    date: dateKey,
                    status: 'holiday',
                    reason: `Feriado: ${holiday.name}`,
                    availableSlots: 0,
                    totalSlots: 0
                })
                continue
            }

            const daySlots = slotsByDay[dayOfWeek] || []
            const totalSlots = daySlots.length

            // 🔹 Bloqueios do dia
            const blockedForDay = allBlockedTimes.filter(block => {
                if (block.isRecurring) {
                    return block.dayOfWeek === dayOfWeek
                } else if (block.date) {
                    const blockDate = new Date(block.date)
                    return blockDate.toDateString() === date.toDateString()
                }
                return false
            })

            const fullBlocked = blockedForDay.some(
                b => !b.startTime && !b.endTime
            )

            if (fullBlocked || totalSlots === 0) {
                days.push({
                    date: dateKey,
                    status: 'blocked',
                    reason: 'Dia bloqueado ou sem horários',
                    availableSlots: 0,
                    totalSlots
                })
                continue
            }

            // 🔹 Filtrar horários bloqueados
            const availableTimes = daySlots.filter(time => {
                return !blockedForDay.some(block => {
                    if (!block.startTime && !block.endTime) return true

                    if (block.startTime && block.endTime) {
                        return time >= block.startTime && time <= block.endTime
                    }

                    if (block.startTime) {
                        return time >= block.startTime
                    }

                    if (block.endTime) {
                        return time <= block.endTime
                    }

                    return false
                })
            })

            const bookedCount = appointmentsByDate[dateKey] || 0
            const realAvailable = availableTimes.length - bookedCount

            // 🔹 Status final
            if (realAvailable <= 0) {
                days.push({
                    date: dateKey,
                    status: 'blocked',
                    reason: 'Todos os horários ocupados',
                    availableSlots: 0,
                    totalSlots
                })
            } else if (realAvailable < totalSlots / 2) {
                days.push({
                    date: dateKey,
                    status: 'partial',
                    reason: `${realAvailable} horário(s) disponível(is)`,
                    availableSlots: realAvailable,
                    totalSlots
                })
            } else {
                days.push({
                    date: dateKey,
                    status: 'available',
                    reason: `${realAvailable} horários disponíveis`,
                    availableSlots: realAvailable,
                    totalSlots
                })
            }
        }

        return NextResponse.json({
            success: true,
            days
        })

    } catch (error) {
        console.error('Erro ao buscar status do mês:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar status do mês' },
            { status: 500 }
        )
    }
}