// app/api/appointments/reschedule/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { appointmentId, newDate, newTime } = await request.json()

        if (!appointmentId || !newDate || !newTime) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        // 1. Buscar agendamento original
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

        // 2. Verificar se é o dono do agendamento
        if (appointment.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Você não pode reagendar este agendamento' },
                { status: 403 }
            )
        }

        // 3. Verificar se o agendamento pode ser reagendado
        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            return NextResponse.json(
                { success: false, error: 'Este agendamento não pode ser reagendado' },
                { status: 400 }
            )
        }

        // 4. Verificar se a nova data não é no passado
        const newDateTime = new Date(`${newDate}T${newTime}`)
        const now = new Date()

        if (newDateTime < now) {
            return NextResponse.json(
                { success: false, error: 'Não é possível reagendar para uma data passada' },
                { status: 400 }
            )
        }

        // 5. Verificar antecedência mínima (2 horas)
        const minAdvanceTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
        if (newDateTime < minAdvanceTime) {
            return NextResponse.json(
                { success: false, error: 'É necessário reagendar com pelo menos 2 horas de antecedência' },
                { status: 400 }
            )
        }

        // 6. Verificar se o novo horário está disponível
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                date: new Date(newDate),
                time: newTime,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                },
                id: {
                    not: appointmentId // Excluir o próprio agendamento
                }
            }
        })

        if (existingAppointment) {
            return NextResponse.json(
                { success: false, error: 'Este horário já está ocupado' },
                { status: 400 }
            )
        }

        // 7. Verificar se o horário existe na agenda
        const dayOfWeek = new Date(newDate).getDay()
        const slotExists = await prisma.availableSlot.findFirst({
            where: {
                dayOfWeek: dayOfWeek,
                timeSlot: newTime,
                active: true
            }
        })

        if (!slotExists) {
            return NextResponse.json(
                { success: false, error: 'Este horário não está disponível' },
                { status: 400 }
            )
        }

        // 8. Atualizar o agendamento
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                date: new Date(newDate),
                time: newTime,
                status: 'PENDING', // Volta para pendente após reagendar
                updatedAt: new Date()
            },
            include: {
                service: true,
                user: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedAppointment,
            message: 'Agendamento reagendado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao reagendar:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao reagendar agendamento' },
            { status: 500 }
        )
    }
}