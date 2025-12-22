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

        const params = await context.params
        const id = params.id
        const body = await request.json()
        const { status } = body

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

        // 🆕 REGISTRAR NO HISTÓRICO
        try {
            await prisma.appointmentStatusHistory.create({
                data: {
                    appointmentId: id,
                    status,
                    changedBy: session.user.id,
                    notes: `Status alterado para ${status} pelo admin`
                }
            })
        } catch (historyError) {
            // Se a tabela ainda não existe, só loga mas não falha
            console.log('⚠️ Histórico não registrado:', historyError)
        }

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