// app/api/appointments/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        const paymentMethodsParam = searchParams.get('paymentMethod')

        const paymentMethods = paymentMethodsParam
            ? paymentMethodsParam
                .split(',')
                .map(method =>
                    method
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\s+/g, '_')
                        .toUpperCase()
                )
            : []

        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        const where: any = {
            userId: session.user.id

        }

        if (status) {
            where.status = status
        }

        if (paymentMethods.length > 0) {
            where.paymentMethod = {
                in: paymentMethods
            }
        }

        if (startDate || endDate) {
            where.date = {}

            if (startDate) {
                where.date.gte = new Date(startDate)
            }

            if (endDate) {
                where.date.lte = new Date(endDate)
            }
        }


        const appointments = await prisma.appointment.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true,
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        })


        return NextResponse.json({ success: true, data: appointments })

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

        // 1️⃣ Ler o body PRIMEIRO
        const body = await request.json()

        const {
            serviceId,
            date,
            time,
            notes,
            paymentMethod,
            cupomId,
            valorOriginal,
            valorDesconto,
            valorFinal
        } = body

        // 2️⃣ Normalizar DEPOIS
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


        // Validações
        if (!serviceId || !date || !time) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        // Verificar se o serviço existe
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        })

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Serviço não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe agendamento neste horário
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                date: new Date(date),
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

        // ✅ Validar cupom se foi fornecido
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

            // Verificar validade
            const now = new Date()
            if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
                return NextResponse.json(
                    { success: false, error: 'Cupom fora do período de validade' },
                    { status: 400 }
                )
            }

            // Verificar quantidade de usos
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
                serviceId,
                date: new Date(date),
                time,
                notes: notes || null,
                paymentMethod: normalizedPaymentMethod, // ✅ AGORA SIM
                status: 'PENDING',
                couponId: cupomId || null,
                discountAmount: valorDesconto || 0,
                finalPrice: valorFinal || service.price
            },
            include: {
                service: true,
                user: true,
                coupon: true
            }
        })



        // ✅ Incrementar contador de uso do cupom
        if (cupomId) {
            await prisma.coupon.update({
                where: { id: cupomId },
                data: {
                    usedCount: { increment: 1 }
                }
            })
        }

        return NextResponse.json({
            success: true,
            data: appointment,
            message: 'Agendamento criado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao criar agendamento:', error)
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

        // Buscar agendamento
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        })

        if (!appointment) {
            return NextResponse.json(
                { success: false, error: 'Agendamento não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se o usuário é o dono do agendamento
        if (appointment.userId !== session.user.id
        ) {
            return NextResponse.json(
                { success: false, error: 'Sem permissão para cancelar este agendamento' },
                { status: 403 }
            )
        }

        // Atualizar status para CANCELLED
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' }
        })

        // ✅ Se tinha cupom, decrementar contador ao cancelar
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