import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

        const { id } = await context.params  // PEGA O ID AQUI

        const appointment = await prisma.appointment.findUnique({
            where: { id },  // USA SÓ 'id', NÃO 'params.id'
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
                }
            }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, message: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        const response = {
            ...appointment,
            finalPrice: appointment.finalPrice || appointment.service.price,
            discountAmount: appointment.discountAmount || 0,
            internalNotes: appointment.internalNotes || null,
            paymentMethod: appointment.paymentMethod || null,
            cancelReason: appointment.cancelReason || null,
            rescheduledFrom: appointment.rescheduledFrom || null,
            coupon: null,
            statusHistory: []
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