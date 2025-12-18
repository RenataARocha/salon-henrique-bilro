// app/api/admin/appointments/[id]/update-status/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

        const { id } = await context.params
        const body = await request.json()
        const { status } = body

        // Validar status
        const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Status inválido' },
                { status: 400 }
            )
        }

        // Atualizar o agendamento
        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({
            success: true,
            data: appointment
        })

    } catch (error) {
        console.error('Erro ao atualizar status:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar status' },
            { status: 500 }
        )
    }
}