// app/api/appointments/route.ts
// ✅ VERSÃO COM FILTRO POR DATA PARA COMANDA

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDateSafe } from '@/lib/dateUtils'
import { notifyAppointmentCreated } from '@/lib/notifications'

// GET - Listar agendamentos do usuário logado
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const date = searchParams.get('date') // ✅ NOVO: filtro por data específica
        const paymentMethodsParam = searchParams.get('paymentMethod')

        const paymentMethods = paymentMethodsParam
            ? paymentMethodsParam.split(',').map(method =>
                method.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').toUpperCase()
            )
            : []

        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // ✅ ADMIN vê TODOS os agendamentos, usuário normal só os próprios
        const where: any = {}

        if (session.user.role !== 'ADMIN') {
            where.userId = session.user.id
        }

        if (status) where.status = status
        if (paymentMethods.length > 0) where.paymentMethod = { in: paymentMethods }

        // ✅ NOVO: Filtro por data específica (para comanda)
        if (date) {
            const dateObj = parseDateSafe(date)
            where.date = dateObj
        } else if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = parseDateSafe(startDate)
            if (endDate) {
                const endDateObj = parseDateSafe(endDate)
                endDateObj.setUTCHours(23, 59, 59, 999)
                where.date.lte = endDateObj
            }
        }

        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, phone: true }
                },
                service: {
                    select: { id: true, name: true, price: true, duration: true }
                },
                combo: {
                    include: {
                        services: {
                            include: { service: true }
                        }
                    }
                },
                coupon: true
            },
            orderBy: { date: 'desc' }
        })

        const formattedAppointments = appointments.map(apt => {
            let formattedApt: any = { ...apt, service: apt.service || null, combo: null }

            if (apt.combo) {
                const comboServices = apt.combo.services.map(cs => cs.service)
                const originalPrice = comboServices.reduce((sum, s) => sum + s.price, 0)
                const comboPrice = originalPrice * (1 - apt.combo.discountPercent / 100)

                formattedApt.combo = {
                    id: apt.combo.id,
                    name: apt.combo.name,
                    description: apt.combo.description,
                    services: comboServices,
                    originalPrice,
                    comboPrice,
                    discountPercent: apt.combo.discountPercent
                }

                if (!formattedApt.service && comboServices.length > 0) {
                    formattedApt.service = {
                        id: apt.combo.id,
                        name: apt.combo.name,
                        price: comboPrice,
                        duration: comboServices.reduce((sum, s) => sum + s.duration, 0)
                    }
                }
            }

            return formattedApt
        })

        return NextResponse.json({ success: true, data: formattedAppointments })

    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar agendamentos' },
            { status: 500 }
        )
    }
}

// POST - Criar novo agendamento
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const body = await request.json()

        const {
            serviceId,
            comboId,
            date,
            time,
            notes,
            paymentMethod,
            cupomId,
            valorOriginal,
            valorDesconto,
            valorFinal
        } = body

        if (!serviceId && !comboId) {
            return NextResponse.json(
                { success: false, error: 'Selecione um serviço ou combo' },
                { status: 400 }
            )
        }

        if (serviceId && comboId) {
            return NextResponse.json(
                { success: false, error: 'Selecione apenas um serviço OU um combo' },
                { status: 400 }
            )
        }

        const normalizedPaymentMethod = paymentMethod
            ?.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_')
            .toUpperCase()

        if (!normalizedPaymentMethod) {
            return NextResponse.json(
                { success: false, error: 'Forma de pagamento inválida' },
                { status: 400 }
            )
        }

        if (!date || !time) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        let service = null
        let combo = null
        let finalPrice = valorFinal

        if (serviceId) {
            service = await prisma.service.findUnique({
                where: { id: serviceId }
            })

            if (!service) {
                return NextResponse.json(
                    { success: false, error: 'Serviço não encontrado' },
                    { status: 404 }
                )
            }

            if (!finalPrice) {
                finalPrice = service.price
            }
        }

        if (comboId) {
            combo = await prisma.serviceCombo.findUnique({
                where: { id: comboId },
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

            if (!combo.active) {
                return NextResponse.json(
                    { success: false, error: 'Este combo não está mais disponível' },
                    { status: 400 }
                )
            }

            if (!finalPrice) {
                const services = combo.services.map(cs => cs.service)
                const originalPrice = services.reduce((sum, s) => sum + s.price, 0)
                finalPrice = originalPrice * (1 - combo.discountPercent / 100)
            }
        }

        const appointmentDate = parseDateSafe(date)

        console.log('📅 [CRIAR AGENDAMENTO]:', {
            entrada: date,
            parseada: appointmentDate.toISOString()
        })

        // Verificar conflito
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                date: appointmentDate,
                time: time,
                status: {
                    in: ['PENDING', 'CONFIRMED']
                }
            }
        })

        if (existingAppointment) {
            return NextResponse.json(
                { success: false, error: 'Este horário já está reservado' },
                { status: 400 }
            )
        }

        // Validar cupom se fornecido
        if (cupomId) {
            const coupon = await prisma.coupon.findUnique({
                where: { id: cupomId }
            })

            if (!coupon) {
                return NextResponse.json(
                    { success: false, error: 'Cupom inválido' },
                    { status: 400 }
                )
            }

            if (!coupon.active) {
                return NextResponse.json(
                    { success: false, error: 'Cupom desativado' },
                    { status: 400 }
                )
            }

            const now = new Date()
            if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
                return NextResponse.json(
                    { success: false, error: 'Cupom fora do período de validade' },
                    { status: 400 }
                )
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                return NextResponse.json(
                    { success: false, error: 'Cupom esgotado' },
                    { status: 400 }
                )
            }
        }

        // Criar agendamento
        const appointment = await prisma.appointment.create({
            data: {
                userId: session.user.id,
                serviceId: serviceId || null,
                comboId: comboId || null,
                date: appointmentDate,
                time,
                notes: notes || null,
                paymentMethod: normalizedPaymentMethod,
                status: 'PENDING',
                couponId: cupomId || null,
                discountAmount: valorDesconto || 0,
                finalPrice: finalPrice
            },
            include: {
                service: true,
                combo: {
                    include: {
                        services: {
                            include: {
                                service: true
                            }
                        }
                    }
                },
                user: true,
                coupon: true
            }
        })

        if (cupomId) {
            await prisma.coupon.update({
                where: { id: cupomId },
                data: {
                    usedCount: { increment: 1 }
                }
            })
        }

        console.log('✅ [CRIAR AGENDAMENTO] Sucesso:', {
            id: appointment.id,
            date: appointment.date.toISOString()
        })

        // ✅ ENVIAR NOTIFICAÇÕES (WhatsApp + Email + Sistema)
        try {
            await notifyAppointmentCreated({
                user: appointment.user,
                service: appointment.service || {
                    name: appointment.combo?.name || 'Serviço',
                    price: appointment.finalPrice
                },
                date: appointment.date,
                time: appointment.time
            })

            console.log('✅ Notificações enviadas com sucesso!')
        } catch (notificationError) {
            console.error('⚠️ Erro ao enviar notificações:', notificationError)
            // NÃO bloqueia o agendamento se notificação falhar
        }

        return NextResponse.json({
            success: true,
            data: appointment,
            message: 'Agendamento criado com sucesso!'
        })

    } catch (error) {
        console.error('❌ Erro ao criar agendamento:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar agendamento' },
            { status: 500 }
        )
    }
}

// DELETE - Cancelar agendamento
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const appointmentId = searchParams.get('id')

        if (!appointmentId) {
            return NextResponse.json(
                { success: false, error: 'ID do agendamento não fornecido' },
                { status: 400 }
            )
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        if (appointment.userId !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Sem permissão para cancelar este agendamento' },
                { status: 403 }
            )
        }

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' }
        })

        if (appointment.couponId) {
            await prisma.coupon.update({
                where: { id: appointment.couponId },
                data: {
                    usedCount: { decrement: 1 }
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Agendamento cancelado com sucesso'
        })

    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao cancelar agendamento' },
            { status: 500 }
        )
    }
}