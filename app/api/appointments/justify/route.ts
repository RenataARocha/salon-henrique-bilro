// app/api/appointments/justify/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { appointmentId, justification } = body

        // Validações
        if (!appointmentId || !justification) {
            return NextResponse.json(
                { success: false, error: 'ID do agendamento e justificativa são obrigatórios' },
                { status: 400 }
            )
        }

        if (justification.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: 'A justificativa deve ter no mínimo 10 caracteres' },
                { status: 400 }
            )
        }

        // Buscar agendamento
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                service: true
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se é do usuário
        if (appointment.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Você não tem permissão para justificar este agendamento' },
                { status: 403 }
            )
        }

        // Verificar se o status é NO_SHOW
        if (appointment.status !== 'NO_SHOW') {
            return NextResponse.json(
                { success: false, error: 'Só é possível justificar agendamentos com status "Não Compareceu"' },
                { status: 400 }
            )
        }

        // Verificar se já foi justificado
        if (appointment.justification) {
            return NextResponse.json(
                { success: false, error: 'Este agendamento já foi justificado' },
                { status: 400 }
            )
        }

        // Atualizar com justificativa
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                justification: justification.trim(),
                justifiedAt: new Date()
            },
            include: {
                service: true,
                user: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedAppointment,
            message: 'Justificativa enviada com sucesso'
        })

    } catch (error) {
        console.error('Erro ao justificar falta:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao enviar justificativa' },
            { status: 500 }
        )
    }
}