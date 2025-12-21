// app/api/admin/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// LISTAR TODOS os agendamentos
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const appointments = await prisma.appointment.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                service: {
                    select: {
                        name: true,
                        price: true,
                        duration: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: appointments
        })

    } catch (error) {
        console.error('❌ Erro ao buscar agendamentos:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar agendamentos',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// ATUALIZAR status em lote
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { id, status } = body

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({
            success: true,
            data: appointment
        })

    } catch (error) {
        console.error('❌ Erro ao atualizar:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao atualizar agendamento'
            },
            { status: 500 }
        )
    }
}