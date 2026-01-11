// src/app/api/admin/slots/batch/route.ts
// API para criar múltiplos horários de uma vez

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { timeSlot, dates } = await request.json()

        if (!timeSlot || !dates || !Array.isArray(dates)) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        let created = 0
        let skipped = 0
        const errors: string[] = []

        for (const dateStr of dates) {
            try {
                const date = new Date(dateStr)
                const dayOfWeek = date.getDay()

                // Verificar se já existe
                const existing = await prisma.availableSlot.findFirst({
                    where: {
                        dayOfWeek: dayOfWeek,
                        timeSlot: timeSlot
                    }
                })

                if (existing) {
                    skipped++
                    continue
                }

                // Criar
                await prisma.availableSlot.create({
                    data: {
                        dayOfWeek: dayOfWeek,
                        timeSlot: timeSlot,
                        active: true
                    }
                })

                created++
            } catch (error) {
                errors.push(`Erro ao criar horário para ${dateStr}`)
                console.error(`Erro ao criar horário para ${dateStr}:`, error)
            }
        }

        return NextResponse.json({
            success: true,
            created,
            skipped,
            errors,
            message: `${created} horário(s) criado(s)${skipped > 0 ? `, ${skipped} já existiam` : ''}`
        })

    } catch (error) {
        console.error('❌ Erro ao criar horários em lote:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar horários' },
            { status: 500 }
        )
    }
}