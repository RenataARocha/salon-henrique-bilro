// app/api/admin/appointments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar agendamento específico
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
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                        description: true,
                    }
                },
                combo: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        discountPercent: true,
                        services: {
                            include: {
                                service: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true,
                                        duration: true
                                    }
                                }
                            }
                        }
                    }
                },
                // ✅ ADICIONAR appointmentServices
                appointmentServices: {
                    include: {
                        service: true
                    }
                },
                // ✅ ADICIONAR staffServices (para mostrar funcionário)
                staffServices: {
                    include: {
                        staff: {
                            select: { name: true }
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

        // ✅ FORMATAR RESPOSTA COM staffName
        let finalPrice = 0
        let serviceName = ''
        let staffName: string | null = null

        // ✅ EXTRAIR NOME DO FUNCIONÁRIO
        if (appointment.staffServices && appointment.staffServices.length > 0) {
            staffName = appointment.staffServices[0].staff.name
        }

        // ✅ SE TEM MÚLTIPLOS SERVIÇOS
        if (appointment.appointmentServices && appointment.appointmentServices.length > 0) {
            finalPrice = appointment.appointmentServices.reduce(
                (sum, as) => sum + (as.price * as.quantity),
                0
            )
            serviceName = appointment.appointmentServices
                .map(as => as.quantity > 1 ? `${as.quantity}x ${as.service.name}` : as.service.name)
                .join(' + ')
        }
        // SE TEM COMBO
        else if (appointment.combo) {
            const originalPrice = appointment.combo.services.reduce(
                (sum, cs) => sum + cs.service.price,
                0
            )
            finalPrice = originalPrice * (1 - appointment.combo.discountPercent / 100)
            serviceName = appointment.combo.name
        }
        // SE TEM SERVIÇO ÚNICO
        else if (appointment.service) {
            finalPrice = appointment.service.price
            serviceName = appointment.service.name
        }

        const response = {
            ...appointment,
            serviceName,
            finalPrice,
            staffName, // ✅ ADICIONAR staffName
            discountAmount: 0,
            internalNotes: appointment.internalNotes || null,
            paymentMethod: appointment.paymentMethod || null,
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

        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: { coupon: true }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }


        // 👇 ANTES DE ATUALIZAR O STATUS
        if (
            appointment?.couponId &&
            appointment.status !== 'CANCELLED' &&
            status === 'CANCELLED'
        ) {
            const coupon = await prisma.coupon.findUnique({
                where: { id: appointment.couponId }
            })

            if (coupon && coupon.usedCount > 0) {
                await prisma.coupon.update({
                    where: { id: coupon.id },
                    data: {
                        usedCount: {
                            decrement: 1
                        }
                    }
                })
            }
        }

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
                user: true,
                service: true,
                combo: true,
                coupon: true
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        const itemName = appointment.combo?.name || appointment.service?.name || 'Serviço'

        // 👇 DEVOLVE O CUPOM ANTES DE DELETAR
        if (appointment.couponId) {
            const coupon = await prisma.coupon.findUnique({
                where: { id: appointment.couponId }
            })

            if (coupon && coupon.usedCount > 0) {
                await prisma.coupon.update({
                    where: { id: coupon.id },
                    data: {
                        usedCount: {
                            decrement: 1
                        }
                    }
                })
            }
        }

        // 👇 AGORA DELETA
        await prisma.appointment.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Agendamento excluído com sucesso',
            data: {
                id: appointment.id,
                userName: appointment.user.name,
                serviceName: itemName,
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