// app/api/admin/slots/route.ts - CORRIGIDO (sem email antigo)

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
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // ✅ CORREÇÃO: Removido verificação do email antigo
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        if (!isAdmin) {
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

        return NextResponse.json({
            success: true,
            data: slots
        })
    } catch (error) {
        console.error('Erro ao buscar slots:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar slots' },
            { status: 500 }
        )
    }
}

// POST - Criar novo horário
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // ✅ CORREÇÃO: Removido verificação do email antigo
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado. Você precisa ser administrador.' },
                { status: 403 }
            )
        }

        const { dayOfWeek, timeSlot } = await req.json()

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

        const exists = await prisma.availableSlot.findFirst({
            where: {
                dayOfWeek,
                timeSlot
            }
        })

        if (exists) {
            return NextResponse.json(
                { success: false, error: 'Este horário já existe' },
                { status: 400 }
            )
        }

        const slot = await prisma.availableSlot.create({
            data: {
                dayOfWeek,
                timeSlot,
                active: true
            }
        })

        return NextResponse.json({
            success: true,
            data: slot
        })
    } catch (error) {
        console.error('Erro ao criar slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar horário' },
            { status: 500 }
        )
    }
}

// PATCH - Ativar/Desativar horário
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // ✅ CORREÇÃO: Removido verificação do email antigo
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id, active } = await req.json()

        if (!id || active === undefined) {
            return NextResponse.json(
                { success: false, error: 'Dados incompletos' },
                { status: 400 }
            )
        }

        const slot = await prisma.availableSlot.update({
            where: { id },
            data: { active }
        })

        return NextResponse.json({
            success: true,
            data: slot
        })
    } catch (error) {
        console.error('Erro ao atualizar slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar horário' },
            { status: 500 }
        )
    }
}

// DELETE - Excluir horário
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // ✅ CORREÇÃO: Removido verificação do email antigo
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(req.url)
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
            success: true
        })
    } catch (error) {
        console.error('Erro ao excluir slot:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao excluir horário' },
            { status: 500 }
        )
    }
}