// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        let userId = session.user.id

        if (session.user.role === 'ADMIN') {
            const adminUser = await prisma.user.findFirst({
                where: { email: session.user.email! }
            })
            if (adminUser) userId = adminUser.id
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return NextResponse.json({
            success: true,
            notifications
        })
    } catch (error) {
        console.error('Erro ao buscar notificações:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar notificações' },
            { status: 500 }
        )
    }
}