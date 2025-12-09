// app/api/admin/slots/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os slots
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
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
        console.error('Erro ao buscar slots:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar horários' },
            { status: 500 }
        )
    }
}

// POST - Criar novo slot
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
        const { dayOfWeek, timeSlot } = body

        // Validações
        if (dayOfWeek === undefined || !timeSlot) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos' },
                { status: 400 }
            )
        }

        if (dayOfWeek < 0 || dayOfWeek > 6) {
            return NextResponse.json(
                { success: false, error: 'Dia da semana inválido' },
                { status: 400 }
            )
        }

        // Verificar se já existe
        const existing = await prisma.availableSlot.findUnique({
            where: {
                dayOfWeek_timeSlot: {
                    dayOfWeek,
                    timeSlot
                }
            }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Este horário já existe' },
                { status: 400 }
            )
        }

        // Criar slot
        const slot = await prisma.availableSlot.create({
            data: {
                dayOfWeek,
                timeSlot,
                active: true
            }
        })

        return NextResponse.json({
            success: true,
            data: slot,
            message: 'Horário adicionado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao criar slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao adicionar horário' },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar slot (ativar/desativar)
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { id, active } = body

        if (!id || active === undefined) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            )
        }

        const slot = await prisma.availableSlot.update({
            where: { id },
            data: { active }
        })

        return NextResponse.json({
            success: true,
            data: slot,
            message: 'Horário atualizado!'
        })

    } catch (error) {
        console.error('Erro ao atualizar slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar horário' },
            { status: 500 }
        )
    }
}

// DELETE - Excluir slot
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

        await prisma.availableSlot.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Horário excluído com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao excluir slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao excluir horário' },
            { status: 500 }
        )
    }
}