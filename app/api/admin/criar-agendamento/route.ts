// app/api/admin/criar-agendamento/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

function generateTempPassword(): string {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
}

function generateTempEmail(name: string): string {
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.')
        .replace(/[^a-z.]/g, '')
    const random = Math.floor(Math.random() * 9999)
    return `${slug}.${random}@cliente.salao`
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        const admin = await prisma.user.findUnique({ where: { email: session.user.email! } })
        if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        const {
            clientName, clientPhone, clientEmail, clientBirthDate,
            serviceId, comboId, services,  // ← adiciona services
            date, time, notes, paymentMethod, couponCode, discountAmount, finalPrice,
        } = await req.json()

        // Muda a validação:
        if (!clientName || !date || !time || (!serviceId && !comboId && (!services || services.length === 0))) {
            return NextResponse.json({
                success: false,
                error: 'Nome da cliente, data, horário e serviço são obrigatórios'
            }, { status: 400 })
        }

        // ── 1. Busca ou cria a cliente ──────────────────────────────────────
        let user = null

        if (clientPhone) {
            user = await prisma.user.findFirst({ where: { phone: clientPhone } })
        }

        if (!user && clientEmail) {
            user = await prisma.user.findUnique({ where: { email: clientEmail } })
        }

        if (!user) {
            const email = clientEmail || generateTempEmail(clientName)
            const hashedPassword = await bcrypt.hash(generateTempPassword(), 10)
            user = await prisma.user.create({
                data: {
                    name: clientName,
                    email,
                    password: hashedPassword,
                    phone: clientPhone || null,
                    birthDate: clientBirthDate ? new Date(clientBirthDate) : null,
                    role: 'CLIENT',
                }
            })
        } else {
            const updateData: any = {}
            if (clientBirthDate && !user.birthDate) updateData.birthDate = new Date(clientBirthDate)
            if (clientPhone && !user.phone) updateData.phone = clientPhone
            if (Object.keys(updateData).length > 0) {
                user = await prisma.user.update({ where: { id: user.id }, data: updateData })
            }
        }

        // ── 2. Verifica conflito de horário ─────────────────────────────────
        const dateStart = new Date(date + 'T00:00:00')
        const dateEnd = new Date(date + 'T23:59:59')

        const conflict = await prisma.appointment.findFirst({
            where: {
                date: { gte: dateStart, lte: dateEnd },
                time,
                status: { in: ['PENDING', 'CONFIRMED'] }
            }
        })

        if (conflict) {
            return NextResponse.json({
                success: false,
                error: `Já existe um agendamento para ${date} às ${time}`
            }, { status: 400 })
        }

        // ── 3. Resolve cupom ────────────────────────────────────────────────
        let couponId: string | null = null
        if (couponCode) {
            const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } })
            couponId = coupon?.id || null
        }

        // ── 4. Cria o agendamento ───────────────────────────────────────────
        const appointment = await prisma.appointment.create({
            data: {
                userId: user.id,
                serviceId: serviceId || null,
                comboId: comboId || null,
                date: new Date(date + 'T12:00:00'),
                time,
                status: 'CONFIRMED',
                notes: notes || null,
                paymentMethod: paymentMethod || null,
                couponId,
                discountAmount: discountAmount || 0,
                finalPrice: finalPrice || null,
            },
            include: {
                user: { select: { name: true, email: true, phone: true } },
                service: true,
                combo: { include: { services: { include: { service: true } } } }
            }
        })

        // ── 5. Salva múltiplos serviços se houver ───────────────────────────
        if (services && services.length > 1) {
            for (const s of services) {
                await prisma.appointmentService.create({
                    data: {
                        appointmentId: appointment.id,
                        serviceId: s.serviceId,
                        quantity: s.quantity || 1,
                        price: s.price,
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            data: appointment,
            message: `Agendamento criado para ${user.name}`
        })

    } catch (error) {
        console.error('❌ Erro ao criar agendamento:', error)
        return NextResponse.json({ success: false, error: 'Erro ao criar agendamento' }, { status: 500 })
    }
}