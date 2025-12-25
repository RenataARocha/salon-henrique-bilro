// app/api/admin/coupons/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

        const coupon = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Cupom não encontrado' },
                { status: 404 }
            )
        }

        const updatedCoupon = await prisma.coupon.update({
            where: { id },
            data: {
                active: !coupon.active
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedCoupon,
            message: `Cupom ${updatedCoupon.active ? 'ativado' : 'desativado'} com sucesso!`
        })

    } catch (error) {
        console.error('❌ Erro ao alterar status do cupom:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao alterar status do cupom'
            },
            { status: 500 }
        )
    }
}