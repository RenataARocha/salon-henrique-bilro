import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewCoupon } from '@/lib/notifications'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { couponId } = await req.json()

        const coupon = await prisma.coupon.findUnique({
            where: { id: couponId }
        })

        if (!coupon) {
            return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 })
        }

        await notifyNewCoupon(coupon)

        return NextResponse.json({ success: true, message: 'Notificações enviadas!' })

    } catch (error) {
        console.error('Erro ao notificar cupom:', error)
        return NextResponse.json({ error: 'Erro ao enviar notificações' }, { status: 500 })
    }
}