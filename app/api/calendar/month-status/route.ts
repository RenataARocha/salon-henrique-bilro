// src/app/api/calendar/month-status/route.ts
// API que retorna o status de cada dia do mês

import { NextResponse } from 'next/server'
import { getDayStatus } from '@/lib/schedule-integration'

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

        // Calcular primeiro e último dia do mês
        const firstDay = new Date(year, month - 1, 1)
        const lastDay = new Date(year, month, 0)

        const days = []

        // Para cada dia do mês
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month - 1, day)
            const status = await getDayStatus(date)

            days.push({
                date: date.toISOString().split('T')[0],
                status: status.status,
                reason: status.message,
                availableSlots: status.availableCount,
                totalSlots: status.totalCount
            })
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