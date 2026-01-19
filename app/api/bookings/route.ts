// app/api/bookings/route.ts - CORRIGIDO

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const {
            serviceId,
            date,
            time,
            notes,
            couponCode
        } = await req.json();

        console.log('📅 Criando agendamento:', { date, time })

        if (!serviceId || !date || !time) {
            return NextResponse.json(
                { error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            );
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        });

        if (!service) {
            return NextResponse.json(
                { error: 'Serviço não encontrado' },
                { status: 404 }
            );
        }

        let totalAmount = service.price;
        let couponId = null;
        let discountAmount = 0;

        if (couponCode) {
            const validationResponse = await fetch(
                `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/coupons/validate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': req.headers.get('cookie') || ''
                    },
                    body: JSON.stringify({
                        codigo: couponCode,
                        valorServico: totalAmount,
                        serviceIds: [serviceId],
                        scheduledDate: date,
                        scheduledTime: time
                    })
                }
            );

            if (validationResponse.ok) {
                const couponData = await validationResponse.json();

                if (couponData.valido) {
                    const coupon = await prisma.coupon.findUnique({
                        where: { code: couponCode.toUpperCase() }
                    });

                    if (coupon) {
                        couponId = coupon.id;
                        discountAmount = couponData.desconto.valorDesconto;
                        totalAmount = couponData.desconto.valorFinal;
                    }
                }
            }
        }



        const appointment = await prisma.$transaction(async (tx) => {
            const newAppointment = await tx.appointment.create({
                data: {
                    userId: session.user.id,
                    serviceId,
                    date,
                    time,
                    notes: notes || null,
                    couponId,
                    discountAmount,
                    finalPrice: totalAmount,
                    status: 'PENDING'
                }
            });

            if (couponId) {
                await tx.coupon.update({
                    where: { id: couponId },
                    data: {
                        usedCount: {
                            increment: 1
                        }
                    }
                });
            }

            return newAppointment;
        });

        console.log('✅ Agendamento criado:', {
            id: appointment.id,
            date: appointment.date.toISOString()
        })

        return NextResponse.json({
            success: true,
            data: appointment,
            message: 'Agendamento criado com sucesso!'
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return NextResponse.json(
            { error: 'Erro ao criar agendamento' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const appointmentId = searchParams.get('id');

        if (!appointmentId) {
            return NextResponse.json(
                { error: 'ID do agendamento necessário' },
                { status: 400 }
            );
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment) {
            return NextResponse.json(
                { error: 'Agendamento não encontrado' },
                { status: 404 }
            );
        }

        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = appointment.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: 'Sem permissão' },
                { status: 403 }
            );
        }

        await prisma.$transaction(async (tx) => {
            if (appointment.couponId) {
                await tx.coupon.update({
                    where: { id: appointment.couponId },
                    data: {
                        usedCount: {
                            decrement: 1
                        }
                    }
                });
            }

            await tx.appointment.update({
                where: { id: appointmentId },
                data: {
                    status: 'CANCELLED',
                    cancelReason: 'Cancelado pelo usuário'
                }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'Agendamento cancelado'
        });

    } catch (error) {
        console.error('❌ Erro ao cancelar agendamento:', error);
        return NextResponse.json(
            { error: 'Erro ao cancelar agendamento' },
            { status: 500 }
        );
    }
}