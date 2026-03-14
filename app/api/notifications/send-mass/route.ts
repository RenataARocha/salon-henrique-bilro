// src/app/api/notifications/send-mass/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewCoupon, notifyNewCombo } from '@/lib/notifications'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { tipo, itemId, clienteId } = await request.json()

        // Buscar cliente
        const cliente = await prisma.user.findUnique({
            where: { id: clienteId }
        })

        if (!cliente) {
            return NextResponse.json(
                { success: false, error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        if (tipo === 'cupom') {
            // Buscar cupom
            const cupom = await prisma.coupon.findUnique({
                where: { id: itemId }
            })

            if (!cupom) {
                return NextResponse.json(
                    { success: false, error: 'Cupom não encontrado' },
                    { status: 404 }
                )
            }

            // Enviar notificação de cupom para um cliente
            await notifyNewCoupon(cupom, cliente)

        } else if (tipo === 'combo') {
            // Buscar combo
            const combo = await prisma.serviceCombo.findUnique({
                where: { id: itemId },
                include: {
                    services: {
                        include: {
                            service: true
                        }
                    }
                }
            })

            if (!combo) {
                return NextResponse.json(
                    { success: false, error: 'Combo não encontrado' },
                    { status: 404 }
                )
            }

            // Calcular preços
            const originalPrice = combo.services.reduce(
                (sum, cs) => sum + cs.service.price,
                0
            )
            const comboPrice = originalPrice * (1 - combo.discountPercent / 100)

            // Enviar notificação de combo
            await notifyNewCombo({
                ...combo,
                originalPrice,
                comboPrice,
                services: combo.services.map(cs => cs.service)
            }, cliente)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro ao enviar notificação em massa:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao enviar notificação' },
            { status: 500 }
        )
    }
}