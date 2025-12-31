// app/api/available-slots/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBlockedTimesForDate, isTimeBlocked } from '@/lib/blocked-times-utils'

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

        // Verificar se é domingo (0) - Fechado
        if (dayOfWeek === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Não abrimos aos domingos'
            })
        }

        // Buscar horários disponíveis para este dia da semana
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

        // Buscar agendamentos já marcados para esta data
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

        // 🆕 BUSCAR HORÁRIOS BLOQUEADOS
        const blockedTimes = await getBlockedTimesForDate(selectedDate)

        // Verificar se a data selecionada já passou
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        selectedDate.setHours(0, 0, 0, 0)

        if (selectedDate < today) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Não é possível agendar em datas passadas'
            })
        }

        // Filtrar horários
        let availableTimes = availableSlots
            .map(slot => slot.timeSlot)
            .filter(time => {
                // Já está reservado?
                if (bookedTimes.includes(time)) {
                    return false
                }

                // 🆕 Está bloqueado?
                if (isTimeBlocked(time, blockedTimes)) {
                    return false
                }

                return true
            })

        // Se for hoje, filtrar horários que já passaram
        if (selectedDate.getTime() === today.getTime()) {
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
            data: availableTimes
        })

    } catch (error) {
        console.error('Erro ao buscar horários:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar horários disponíveis' },
            { status: 500 }
        )
    }
}