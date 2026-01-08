// app/api/admin/slots/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os horários
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const slots = await prisma.availableSlot.findMany({
            orderBy: [
                { dayOfWeek: 'asc' },
                { timeSlot: 'asc' }
            ]
        })

        return NextResponse.json({ success: true, data: slots })

    } catch (error) {
        console.error('Erro ao buscar horários:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar horários' },
            { status: 500 }
        )
    }
}

// POST - Criar novo horário
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { dayOfWeek, timeSlot } = body

        if (dayOfWeek === undefined || !timeSlot) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        if (dayOfWeek < 0 || dayOfWeek > 6) {
            return NextResponse.json(
                { success: false, error: 'Dia da semana inválido' },
                { status: 400 }
            )
        }

        const existingSlot = await prisma.availableSlot.findFirst({
            where: { dayOfWeek, timeSlot }
        })

        if (existingSlot) {
            return NextResponse.json(
                { success: false, error: 'Este horário já existe' },
                { status: 409 }
            )
        }

        const newSlot = await prisma.availableSlot.create({
            data: { dayOfWeek, timeSlot, active: true }
        })

        return NextResponse.json({ success: true, data: newSlot }, { status: 201 })

    } catch (error) {
        console.error('Erro ao criar horário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar horário' },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar horário
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id, active } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            )
        }

        const updatedSlot = await prisma.availableSlot.update({
            where: { id },
            data: { active }
        })

        return NextResponse.json({ success: true, data: updatedSlot })

    } catch (error) {
        console.error('Erro ao atualizar horário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar horário' },
            { status: 500 }
        )
    }
}

// DELETE - Deletar horário
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
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

        await prisma.availableSlot.delete({ where: { id } })

        return NextResponse.json({ success: true, message: 'Horário excluído' })

    } catch (error) {
        console.error('Erro ao deletar horário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar horário' },
            { status: 500 }
        )
    }
}