// src/app/api/notifications/read-all/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false
            },
            data: { read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar notificações' },
            { status: 500 }
        )
    }
}