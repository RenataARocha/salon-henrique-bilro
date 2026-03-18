// app/api/appointments/reschedule/route.ts
// ✅ VERSÃO FINAL COM TIMEZONE CORRETO

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDateSafe } from '@/lib/dateUtils'
import { notifyAppointmentRescheduled } from '@/lib/notifications'

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

        console.log('📅 [REAGENDAMENTO] Recebido:', { appointmentId, newDate, newTime })

        if (!appointmentId || !newDate || !newTime) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                service: true,
                combo: true
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        const oldDate = appointment.date.toISOString().split('T')[0]
        const oldTime = appointment.time

        const isAdmin = session.user.role === 'ADMIN'
        const isOwner = appointment.userId === session.user.id

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { success: false, error: 'Você não pode reagendar este agendamento' },
                { status: 403 }
            )
        }

        if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
            return NextResponse.json(
                { success: false, error: 'Este agendamento não pode ser reagendado' },
                { status: 400 }
            )
        }

        // ✅ CRIAR DATA EM UTC (12:00 para evitar problemas de timezone)
        const dateToSave = parseDateSafe(newDate)

        console.log('📅 [REAGENDAMENTO] Data:', {
            entrada: newDate,
            salvar: dateToSave.toISOString()
        })

        // Validar data/hora
        const [hour, minute] = newTime.split(':').map(Number)
        const newDateTime = new Date(dateToSave)
        newDateTime.setUTCHours(hour, minute, 0, 0)

        const now = new Date()

        if (newDateTime < now) {
            return NextResponse.json(
                { success: false, error: 'Não é possível reagendar para uma data passada' },
                { status: 400 }
            )
        }

        if (!isAdmin) {
            const minAdvanceTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
            if (newDateTime < minAdvanceTime) {
                return NextResponse.json(
                    { success: false, error: 'É necessário reagendar com pelo menos 2 horas de antecedência' },
                    { status: 400 }
                )
            }
        }

        // ✅ VERIFICAR CONFLITO
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                date: dateToSave,
                time: newTime,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                },
                id: {
                    not: appointmentId
                }
            }
        })

        if (existingAppointment) {
            return NextResponse.json(
                { success: false, error: 'Este horário já está ocupado' },
                { status: 400 }
            )
        }

        const dayOfWeek = dateToSave.getUTCDay()
        const slotExists = await prisma.availableSlot.findFirst({
            where: {
                dayOfWeek: dayOfWeek,
                timeSlot: newTime,
                active: true
            }
        })

        if (!slotExists) {
            return NextResponse.json(
                { success: false, error: 'Este horário não está disponível na agenda' },
                { status: 400 }
            )
        }

        // ✅ ATUALIZAR
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                date: dateToSave,
                time: newTime,
                status: 'PENDING',
                updatedAt: new Date()
            },
            include: {
                service: true,
                user: true,
                combo: {
                    include: {
                        services: {
                            include: { service: true }
                        }
                    }
                }
            }
        })

        const oldDateFormatted = appointment.date.toLocaleDateString('pt-BR')


        try {
            await notifyAppointmentRescheduled({
                id: updatedAppointment.id,
                user: updatedAppointment.user,
                service: updatedAppointment.service || {
                    name: updatedAppointment.combo?.name || 'Serviço',
                    price: updatedAppointment.finalPrice
                },
                date: updatedAppointment.date,
                time: updatedAppointment.time
            }, oldDateFormatted, oldTime)
            console.log('✅ WhatsApp de reagendamento enviado!')
        } catch (notifError) {
            console.error('⚠️ Erro ao enviar WhatsApp:', notifError)
        }

        console.log('✅ [REAGENDAMENTO] Sucesso:', {
            id: updatedAppointment.id,
            de: `${oldDate} às ${oldTime}`,
            para: `${newDate} às ${newTime}`,
            savedDate: updatedAppointment.date.toISOString()
        })

        return NextResponse.json({
            success: true,
            data: updatedAppointment,
            message: 'Agendamento reagendado com sucesso!',
            changes: {
                from: `${oldDate} às ${oldTime}`,
                to: `${newDate} às ${newTime}`
            }
        })

    } catch (error) {
        console.error('❌ [REAGENDAMENTO] Erro:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao reagendar agendamento' },
            { status: 500 }
        )
    }
}