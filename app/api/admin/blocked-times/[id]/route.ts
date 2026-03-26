// src/app/api/admin/blocked-times/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Prisma } from '@prisma/client'

type BlockedTimeUpdateInput = Prisma.BlockedTimeUpdateInput

// ✅ CORREÇÃO: params agora é Promise no Next.js 16
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        // ✅ Await params
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            )
        }

        const blocked = await prisma.blockedTime.findUnique({
            where: { id }
        })

        if (!blocked) {
            return NextResponse.json(
                { success: false, error: 'Bloqueio não encontrado' },
                { status: 404 }
            )
        }

        await prisma.blockedTime.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Bloqueio removido com sucesso'
        })

    } catch (error) {
        console.error('❌ Erro ao deletar bloqueio:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar bloqueio' },
            { status: 500 }
        )
    }
}

// ✅ CORREÇÃO: PUT também precisa de await params
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        // ✅ Await params
        const { id } = await params
        const body = await request.json()

        function parseDate(dateStr: string): Date {
            const [year, month, day] = dateStr.split('-').map(Number)
            return new Date(year, month - 1, day, 12, 0, 0, 0)
        }

        const { type, reason, description, isRecurring, date, startTime, endTime, dayOfWeek, startDate, endDate } = body

        const data: BlockedTimeUpdateInput = {
            type,
            reason,
            description: description || null,
            isRecurring,
            startTime: startTime || null,
            endTime: endTime || null
        }

        if (isRecurring) {
            data.dayOfWeek = dayOfWeek ?? null
            data.startDate = startDate ? parseDate(startDate) : null
            data.endDate = endDate ? parseDate(endDate) : null
            data.date = null
        } else {
            data.date = date ? parseDate(date) : null

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