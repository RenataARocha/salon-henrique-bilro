// app/api/admin/appointments/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os agendamentos (ADMIN)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar se está autenticado e é admin
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Sem permissão' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = {}

        if (status && status !== 'all') {
            where.status = status
        }

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                service: {
                    select: {
                        id: true,
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

        return NextResponse.json({ success: true, data: appointments })

    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar agendamentos' },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar status do agendamento (ADMIN)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        // Verificar se está autenticado e é admin
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Sem permissão' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json(
                { success: false, error: 'ID e status são obrigatórios' },
                { status: 400 }
            )
        }

        // Validar status
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Status inválido' },
                { status: 400 }
            )
        }

        // Verificar se o agendamento existe
        const appointment = await prisma.appointment.findUnique({
            where: { id }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // Atualizar status
        const updatedAppointment = await prisma.appointment.update({
            where: { id },
            data: { status },
            include: {
                user: true,
                service: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedAppointment,
            message: 'Status atualizado com sucesso'
        })

    } catch (error) {
        console.error('Erro ao atualizar status:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar status' },
            { status: 500 }
        )
    }
}

// DELETE - Deletar agendamento (ADMIN)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Sem permissão' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            )
        }

        await prisma.appointment.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Agendamento deletado com sucesso'
        })

    } catch (error) {
        console.error('Erro ao deletar agendamento:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar agendamento' },
            { status: 500 }
        )
    }
}