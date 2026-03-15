import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false }, { status: 401 })
        }

        let userId = session.user.id
        if (session.user.role === 'ADMIN') {
            const admin = await prisma.user.findFirst({
                where: { email: session.user.email! }
            })
            if (admin) userId = admin.id
        }

        await prisma.notification.deleteMany({
            where: { userId, read: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}