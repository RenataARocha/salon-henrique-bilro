// app/api/admin/services/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Criar novo serviço
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, description, price, duration } = body

        if (!name || !price || !duration) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        const service = await prisma.service.create({
            data: {
                name,
                description: description || '',
                price: parseFloat(price),
                duration: parseInt(duration),
                active: true
            }
        })

        return NextResponse.json({
            success: true,
            data: service,
            message: 'Serviço criado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao criar serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar serviço' },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar serviço
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
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

        const body = await request.json()

        const service = await prisma.service.update({
            where: { id },
            data: body
        })

        return NextResponse.json({
            success: true,
            data: service,
            message: 'Serviço atualizado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao atualizar serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar serviço' },
            { status: 500 }
        )
    }
}

// DELETE - Excluir serviço
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
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

        // Verificar se há agendamentos pendentes para este serviço
        const pendingAppointments = await prisma.appointment.count({
            where: {
                serviceId: id,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            }
        })

        if (pendingAppointments > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Não é possível excluir. Existem ${pendingAppointments} agendamento(s) pendente(s) para este serviço.`
                },
                { status: 400 }
            )
        }

        await prisma.service.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Serviço excluído com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao excluir serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao excluir serviço' },
            { status: 500 }
        )
    }
}