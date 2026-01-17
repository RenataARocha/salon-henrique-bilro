// app/api/admin/appointments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar detalhes do agendamento
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

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        birthDate: true,
                        image: true,
                    }
                },
                service: {
                    select: {
                        name: true,
                        price: true,
                        duration: true,
                        description: true,
                    }
                },
                // ✅ ADICIONAR COMBO
                combo: {
                    select: {
                        name: true,
                        description: true,
                        discountPercent: true,
                        services: {
                            include: {
                                service: {
                                    select: {
                                        name: true,
                                        price: true,
                                        duration: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // BUSCAR HISTÓRICO
        let statusHistory: Array<{
            status: string
            changedAt: Date
            notes: string | null
        }> = []

        try {
            statusHistory = await prisma.appointmentStatusHistory.findMany({
                where: { appointmentId: id },
                orderBy: { changedAt: 'desc' },
                select: {
                    status: true,
                    changedAt: true,
                    notes: true
                }
            })
        } catch (error) {
            console.log('⚠️ Histórico não disponível')
        }

        // ✅ CALCULAR PREÇO BASEADO EM SERVIÇO OU COMBO
        let finalPrice = 0
        let serviceName = ''

        if (appointment.combo) {
            // Calcular preço do combo
            const originalPrice = appointment.combo.services.reduce(
                (sum, cs) => sum + cs.service.price,
                0
            )
            finalPrice = originalPrice * (1 - appointment.combo.discountPercent / 100)
            serviceName = appointment.combo.name
        } else if (appointment.service) {
            finalPrice = appointment.service.price
            serviceName = appointment.service.name
        }

        const response = {
            ...appointment,
            serviceName, // ✅ Nome do serviço ou combo
            finalPrice,  // ✅ Preço calculado
            discountAmount: 0,
            internalNotes: appointment.internalNotes || null,
            paymentMethod: null,
            cancelReason: null,
            rescheduledFrom: null,
            coupon: null,
            statusHistory
        }

        return NextResponse.json({
            success: true,
            data: response
        })
    } catch (error) {
        console.error('❌ Erro ao buscar detalhes:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar detalhes',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar status do agendamento
export async function PATCH(
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

        // Verificar se agendamento existe
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // Atualizar status
        const updated = await prisma.appointment.update({
            where: { id },
            data: { status }
        })

        return NextResponse.json({
            success: true,
            message: 'Status atualizado com sucesso',
            data: updated
        })
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao atualizar agendamento' },
            { status: 500 }
        )
    }
}

// DELETE - Excluir agendamento permanentemente
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar autenticação e permissão ADMIN
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const params = await context.params
        const id = params.id

        // Verificar se agendamento existe
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                user: true,
                service: true,
                combo: true // ✅ INCLUIR COMBO
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // ✅ PEGAR NOME DO SERVIÇO OU COMBO
        const itemName = appointment.combo?.name || appointment.service?.name || 'Serviço'

        // Excluir agendamento
        await prisma.appointment.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Agendamento excluído com sucesso',
            data: {
                id: appointment.id,
                userName: appointment.user.name,
                serviceName: itemName, // ✅ USAR NOME CORRETO
                date: appointment.date,
                time: appointment.time
            }
        })
    } catch (error) {
        console.error('Erro ao excluir agendamento:', error)
        return NextResponse.json(
            { success: false, message: 'Erro ao excluir agendamento' },
            { status: 500 }
        )
    }
}