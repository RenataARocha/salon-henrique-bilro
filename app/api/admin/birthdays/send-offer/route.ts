// app/api/admin/birthdays/send-offer/route.ts


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBirthdayEmail } from '@/lib/email/birthday-template'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            userId,
            discountValue = 20,
            discountType = 'PERCENTAGE',
            validDays = 30,
            applicableServices,
            sendEmail = true,
            sendWhatsApp = false
        } = body

        // 🔒 Blindagem contra null / undefined
        const safeApplicableServices = Array.isArray(applicableServices)
            ? applicableServices
            : []


        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                birthDate: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Criar código do cupom
        const firstName = user.name.split(' ')[0].toUpperCase()
        const couponCode = `ANIVERSARIO-${firstName}-${new Date().getFullYear()}`

        // Verificar se já existe cupom
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: couponCode }
        })

        let coupon

        if (existingCoupon) {
            // Atualizar cupom existente
            coupon = await prisma.coupon.update({
                where: { code: couponCode },
                data: {
                    discountValue,
                    discountType,
                    validFrom: new Date(),
                    validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
                    active: true,
                    maxUses: 1,
                    usedCount: 0,
                    applicableServices: safeApplicableServices
                }
            })
        } else {
            // Criar novo cupom
            coupon = await prisma.coupon.create({
                data: {
                    code: couponCode,
                    description: `Cupom de aniversário para ${user.name}`,
                    discountType,
                    discountValue,
                    validFrom: new Date(),
                    validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000),
                    active: true,
                    maxUses: 1,
                    usedCount: 0,
                    applicableServices: safeApplicableServices
                }
            })
        }

        // Enviar email
        let emailSent = false
        if (sendEmail && user.email) {
            try {
                await sendBirthdayEmail({
                    to: user.email,
                    name: user.name,
                    couponCode: coupon.code,
                    discountValue: coupon.discountValue,
                    discountType: coupon.discountType,
                    validUntil: coupon.validUntil
                })
                emailSent = true
            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError)
            }
        }

        // TODO: Enviar WhatsApp (quando integrado)
        let whatsappSent = false
        if (sendWhatsApp && user.phone) {
            // Implementar quando tiver Twilio configurado
            whatsappSent = false
        }

        return NextResponse.json({
            success: true,
            data: {
                coupon,
                emailSent,
                whatsappSent
            },
            message: 'Oferta de aniversário criada com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao enviar oferta:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao enviar oferta',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}