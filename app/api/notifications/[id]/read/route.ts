import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getUserId(session: any): Promise<string> {
    if (session.user.role === 'ADMIN') {
        const admin = await prisma.user.findFirst({
            where: { email: session.user.email! }
        })
        if (admin) return admin.id
    }
    return session.user.id
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false }, { status: 401 })
        }
        const userId = await getUserId(session)
        const { id } = await params
        await prisma.notification.deleteMany({
            where: { id, userId }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false }, { status: 401 })
        }
        const userId = await getUserId(session)
        const { id } = await params
        await prisma.notification.updateMany({
            where: { id, userId },
            data: { read: true }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}