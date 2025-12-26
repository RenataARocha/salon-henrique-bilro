// app/api/admin/cupons/toggle/route.ts
// (NÃO é [id]/toggle, é só toggle)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        // Pegar ID do body ao invés dos params
        const body = await request.json()
        const { id, ativo } = body

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID não fornecido' },
                { status: 400 }
            )
        }

        const coupon = await prisma.coupon.findUnique({
            where: { id }
        })

        if (!coupon) {
            return NextResponse.json(
                { success: false, message: 'Cupom não encontrado' },
                { status: 404 }
            )
        }

        // Usar o valor do ativo enviado no body (mais direto)
        const updatedCoupon = await prisma.coupon.update({
            where: { id },
            data: {
                active: ativo
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