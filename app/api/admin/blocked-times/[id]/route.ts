// app/api/admin/blocked-times/[id]/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// BUSCAR bloqueio específico
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const params = await context.params
        const id = params.id

        const blockedTime = await prisma.blockedTime.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!blockedTime) {
            return NextResponse.json(
                { success: false, message: 'Bloqueio não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: blockedTime
        })

    } catch (error) {
        console.error('❌ Erro ao buscar bloqueio:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar bloqueio',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// ATUALIZAR bloqueio
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const params = await context.params
        const id = params.id
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

        const blockedTime = await prisma.blockedTime.update({
            where: { id },
            data: {
                type,
                date: date ? new Date(date) : null,
                startTime,
                endTime,
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
                isRecurring,
                reason,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null
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
            data: blockedTime,
            message: 'Bloqueio atualizado com sucesso'
        })

    } catch (error) {
        console.error('❌ Erro ao atualizar bloqueio:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao atualizar bloqueio',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// DELETAR bloqueio
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const params = await context.params
        const id = params.id

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
            {
                success: false,
                message: 'Erro ao deletar bloqueio',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}