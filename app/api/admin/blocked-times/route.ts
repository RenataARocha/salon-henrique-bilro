// src/app/api/admin/blocked-times/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

type BlockedTimeCreateInput = Prisma.BlockedTimeCreateInput
type BlockedTimeUpdateInput = Prisma.BlockedTimeUpdateInput




// ✅ Criar Date no timezone local (sem conversão UTC)
function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0, 0) // Meio-dia evita problemas
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const { type, reason, description, isRecurring, date, startTime, endTime, dayOfWeek, startDate, endDate } = body

        if (!type || !reason) {
            return NextResponse.json(
                { success: false, error: 'Tipo e motivo são obrigatórios' },
                { status: 400 }
            )
        }

        // ✅ SOLUÇÃO: FÉRIAS = 1 ÚNICO REGISTRO COM PERÍODO
        if (type === 'VACATION' && !isRecurring) {
            if (!date || !endDate) {
                return NextResponse.json(
                    { success: false, error: 'Férias requerem data de início e fim' },
                    { status: 400 }
                )
            }

            const startDateParsed = parseDate(date)
            const endDateParsed = parseDate(endDate)

            if (startDateParsed > endDateParsed) {
                return NextResponse.json(
                    { success: false, error: 'Data de início deve ser antes da data de fim' },
                    { status: 400 }
                )
            }

            // ✅ CRIAR APENAS 1 REGISTRO
            const vacation = await prisma.blockedTime.create({
                data: {
                    type,
                    reason,
                    description: description || null,
                    isRecurring: false,
                    date: startDateParsed,      // Data de início
                    startDate: startDateParsed,  // Opcional: redundância para clareza
                    endDate: endDateParsed,      // Data de fim
                    startTime: null,
                    endTime: null,
                    creator: {
                        connect: { id: user.id }
                    }
                },
                include: {
                    creator: {
                        select: { name: true }
                    }
                }
            })

            return NextResponse.json({
                success: true,
                data: vacation,
                message: `✈️ Férias criadas de ${date} até ${endDate}`
            })
        }

        // ✅ BLOQUEIO NORMAL (Pontual ou Recorrente)
        const data: BlockedTimeCreateInput = {
            type,
            reason,
            description: description || null,
            isRecurring,
            startTime: startTime || null,
            endTime: endTime || null,
            creator: {
                connect: { id: user.id }
            }
        }

        if (isRecurring) {
            if (dayOfWeek === undefined || dayOfWeek === null) {
                return NextResponse.json(
                    { success: false, error: 'Dia da semana é obrigatório para bloqueios recorrentes' },
                    { status: 400 }
                )
            }
            data.dayOfWeek = dayOfWeek ?? null
            data.startDate = startDate ? parseDate(startDate) : null
            data.endDate = endDate ? parseDate(endDate) : null
        } else {
            if (!date) {
                return NextResponse.json(
                    { success: false, error: 'Data é obrigatória para bloqueios pontuais' },
                    { status: 400 }
                )
            }
            data.date = parseDate(date)
        }

        const blocked = await prisma.blockedTime.create({
            data,
            include: {
                creator: {
                    select: { name: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: blocked,
            message: 'Bloqueio criado com sucesso'
        })

    } catch (error) {
        console.error('❌ Erro ao criar bloqueio:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar bloqueio' },
            { status: 500 }
        )
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const blockedTimes = await prisma.blockedTime.findMany({
            include: {
                creator: {
                    select: { name: true }
                }
            },
            orderBy: [
                { isRecurring: 'desc' },
                { date: 'desc' },
                { dayOfWeek: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            data: blockedTimes
        })
    } catch (error) {
        console.error('❌ Erro ao buscar bloqueios:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar bloqueios' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { id, type, reason, description, isRecurring, date, startTime, endTime, dayOfWeek, startDate, endDate } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID é obrigatório' },
                { status: 400 }
            )
        }

        const data: BlockedTimeUpdateInput = {
            type,
            reason,
            description: description || null,
            isRecurring,
            startTime: startTime || null,
            endTime: endTime || null,

        }

        if (isRecurring) {
            data.dayOfWeek = dayOfWeek ?? null
            data.startDate = startDate ? parseDate(startDate) : null
            data.endDate = endDate ? parseDate(endDate) : null
            data.date = null
        } else {
            data.date = date ? parseDate(date) : null

            // ✅ Para férias na edição
            if (type === 'VACATION' && endDate) {
                data.endDate = parseDate(endDate)
            }
        }

        const blocked = await prisma.blockedTime.update({
            where: { id },
            data,
            include: {
                creator: {
                    select: { name: true }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: blocked
        })
    } catch (error) {
        console.error('❌ Erro ao atualizar bloqueio:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar bloqueio' },
            { status: 500 }
        )
    }
}