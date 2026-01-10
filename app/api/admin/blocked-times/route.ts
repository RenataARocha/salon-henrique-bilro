import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os bloqueios
export async function GET() {
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

        const blockedTimes = await prisma.blockedTime.findMany({
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { isRecurring: 'desc' },
                { date: 'asc' }
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

// POST - Criar novo bloqueio
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

        const body = await request.json()
        const {
            type,
            date,
            startTime,
            endTime,
            dayOfWeek,
            isRecurring,
            reason,
            description,
            startDate,
            endDate
        } = body

        if (!type || !reason) {
            return NextResponse.json(
                { success: false, error: 'Tipo e motivo são obrigatórios' },
                { status: 400 }
            )
        }

        if (isRecurring && (dayOfWeek === undefined || dayOfWeek === null)) {
            return NextResponse.json(
                { success: false, error: 'Dia da semana é obrigatório para bloqueios recorrentes' },
                { status: 400 }
            )
        }

        const blockedTime = await prisma.blockedTime.create({
            data: {
                type,
                date: date ? new Date(date) : null,
                startTime: startTime || null,
                endTime: endTime || null,
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
                isRecurring: isRecurring || false,
                reason,
                description: description || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                createdBy: user.id
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: blockedTime
        })

    } catch (error) {
        console.error('❌ Erro ao criar bloqueio:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar bloqueio' },
            { status: 500 }
        )
    }
}