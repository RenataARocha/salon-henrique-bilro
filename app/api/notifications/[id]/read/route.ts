// src/app/api/notifications/[id]/read/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { id } = await params

        await prisma.notification.updateMany({
            where: {
                id,
                userId: session.user.id
            },
            data: { read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar notificação' },
            { status: 500 }
        )
    }
}