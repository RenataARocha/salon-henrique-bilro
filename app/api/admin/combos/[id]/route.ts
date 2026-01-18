// app/api/admin/combos/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Atualizar combo
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

        const combo = await prisma.serviceCombo.update({
            where: { id },
            data: body,
            include: {
                services: {
                    include: {
                        service: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Combo atualizado com sucesso!',
            data: combo
        })

    } catch (error) {
        console.error('❌ Erro ao atualizar combo:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao atualizar combo',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// DELETE - Excluir combo
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

        await prisma.serviceCombo.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Combo excluído com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao excluir combo:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao excluir combo',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}