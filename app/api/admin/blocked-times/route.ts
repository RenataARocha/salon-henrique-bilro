// src/app/api/admin/blocked-times/route.ts - CORREÇÃO USER ID

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ✅ FUNÇÃO: Converter data string para Date UTC correto
function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        // ✅ BUSCAR USUÁRIO PELO EMAIL
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

        // ✅ CASO ESPECIAL: FÉRIAS (criar bloqueio para cada dia do período)
        if (type === 'VACATION' && date && endDate) {
            const startDateParsed = parseDate(date)
            const endDateParsed = parseDate(endDate)

            if (startDateParsed > endDateParsed) {
                return NextResponse.json(
                    { success: false, error: 'Data de início deve ser antes da data de fim' },
                    { status: 400 }
                )
            }

            const blockedDates = []
            const currentDate = new Date(startDateParsed)

            while (currentDate <= endDateParsed) {
                const blocked = await prisma.blockedTime.create({
                    data: {
                        type,
                        reason,
                        description: description || null,
                        isRecurring: false,
                        date: new Date(currentDate),
                        startTime: startTime || null,
                        endTime: endTime || null,
                        creator: {
                            connect: { id: user.id } // ✅ USAR user.id
                        }
                    },
                    include: {
                        creator: {
                            select: { name: true }
                        }
                    }
                })

                blockedDates.push(blocked)
                currentDate.setDate(currentDate.getDate() + 1)
            }

            return NextResponse.json({
                success: true,
                data: blockedDates,
                message: `✈️ Férias criadas para ${blockedDates.length} dias`
            })
        }

        // ✅ BLOQUEIO NORMAL (pontual ou recorrente)
        const data: any = {
            type,
            reason,
            description: description || null,
            isRecurring,
            startTime: startTime || null,
            endTime: endTime || null,
            creator: {
                connect: { id: user.id } // ✅ USAR user.id
            }
        }

        if (isRecurring) {
            data.dayOfWeek = dayOfWeek
            data.startDate = startDate ? parseDate(startDate) : null
            data.endDate = endDate ? parseDate(endDate) : null
        } else {
            data.date = date ? parseDate(date) : null
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

        const data: any = {
            type,
            reason,
            description: description || null,
            isRecurring,
            startTime: startTime || null,
            endTime: endTime || null
        }

        if (isRecurring) {
            data.dayOfWeek = dayOfWeek
            data.startDate = startDate ? parseDate(startDate) : null
            data.endDate = endDate ? parseDate(endDate) : null
            data.date = null
        } else {
            data.date = date ? parseDate(date) : null
            data.dayOfWeek = null
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