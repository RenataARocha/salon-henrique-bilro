import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAppointmentReminder } from '@/lib/notifications'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { appointmentId } = await req.json()

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                service: true,
                combo: true
            }
        })

        if (!appointment) {
            return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 })
        }

        await notifyAppointmentReminder({
            id: appointment.id,
            user: appointment.user,
            service: appointment.service || {
                name: appointment.combo?.name || 'Serviço',
                price: appointment.finalPrice
            },
            date: appointment.date,
            time: appointment.time
        })

        return NextResponse.json({ success: true, message: 'Lembrete enviado!' })

    } catch (error) {
        console.error('Erro ao enviar lembrete:', error)
        return NextResponse.json({ error: 'Erro ao enviar lembrete' }, { status: 500 })
    }
}