// app/api/admin/appointments/bulk-action/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { action, appointmentIds } = await req.json();

        if (!action || !appointmentIds || !Array.isArray(appointmentIds)) {
            return NextResponse.json(
                { success: false, error: 'Ação e IDs são obrigatórios' },
                { status: 400 }
            );
        }

        if (appointmentIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Selecione pelo menos um agendamento' },
                { status: 400 }
            );
        }

        let result;
        let message = '';

        switch (action) {
            case 'confirm':
                // Confirmar agendamentos
                result = await prisma.appointment.updateMany({
                    where: {
                        id: { in: appointmentIds },
                        status: { in: ['PENDING', 'REQUESTED'] }
                    },
                    data: {
                        status: 'CONFIRMED'
                    }
                });

                // Registrar no histórico
                for (const id of appointmentIds) {
                    await prisma.appointmentStatusHistory.create({
                        data: {
                            appointmentId: id,
                            status: 'CONFIRMED',
                            changedBy: session.user.id,
                            notes: 'Confirmado em massa'
                        }
                    });
                }

                message = `${result.count} agendamento(s) confirmado(s) com sucesso`;
                break;

            case 'cancel':
                // Cancelar agendamentos
                result = await prisma.appointment.updateMany({
                    where: {
                        id: { in: appointmentIds },
                        status: { not: 'CANCELLED' }
                    },
                    data: {
                        status: 'CANCELLED',
                        cancelReason: 'Cancelado em massa pelo admin'
                    }
                });

                // Registrar no histórico
                for (const id of appointmentIds) {
                    await prisma.appointmentStatusHistory.create({
                        data: {
                            appointmentId: id,
                            status: 'CANCELLED',
                            changedBy: session.user.id,
                            notes: 'Cancelado em massa'
                        }
                    });
                }

                message = `${result.count} agendamento(s) cancelado(s) com sucesso`;
                break;

            case 'complete':
                // Marcar como concluído
                result = await prisma.appointment.updateMany({
                    where: {
                        id: { in: appointmentIds },
                        status: { in: ['CONFIRMED', 'PENDING'] }
                    },
                    data: {
                        status: 'COMPLETED'
                    }
                });

                // Registrar no histórico
                for (const id of appointmentIds) {
                    await prisma.appointmentStatusHistory.create({
                        data: {
                            appointmentId: id,
                            status: 'COMPLETED',
                            changedBy: session.user.id,
                            notes: 'Concluído em massa'
                        }
                    });
                }

                message = `${result.count} agendamento(s) marcado(s) como concluído`;
                break;

            case 'delete':
                // Deletar agendamentos (use com cuidado!)
                result = await prisma.appointment.deleteMany({
                    where: {
                        id: { in: appointmentIds }
                    }
                });

                message = `${result.count} agendamento(s) deletado(s)`;
                break;

            case 'export':
                // ✅ BUSCAR DADOS COMPLETOS INCLUINDO COMBO
                const appointments = await prisma.appointment.findMany({
                    where: {
                        id: { in: appointmentIds }
                    },
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        service: {
                            select: {
                                name: true,
                                price: true
                            }
                        },
                        combo: {
                            select: {
                                name: true,
                                discountPercent: true,
                                services: {
                                    include: {
                                        service: {
                                            select: {
                                                price: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                // ✅ FORMATAR PARA CSV/EXCEL COM SUPORTE A COMBOS
                const csvData = appointments.map(apt => {
                    let serviceName = '';
                    let servicePrice = 0;

                    if (apt.combo) {
                        serviceName = apt.combo.name;
                        const originalPrice = apt.combo.services.reduce(
                            (sum, cs) => sum + cs.service.price,
                            0
                        );
                        servicePrice = originalPrice * (1 - apt.combo.discountPercent / 100);
                    } else if (apt.service) {
                        serviceName = apt.service.name;
                        servicePrice = apt.service.price;
                    }

                    return {
                        id: apt.id,
                        cliente: apt.user.name,
                        email: apt.user.email,
                        telefone: apt.user.phone || '',
                        servico: serviceName,
                        data: new Date(apt.date).toLocaleDateString('pt-BR'),
                        horario: apt.time,
                        status: apt.status,
                        preco: apt.finalPrice || servicePrice,
                        observacoes: apt.notes || ''
                    };
                });

                return NextResponse.json({
                    success: true,
                    data: csvData,
                    message: 'Dados preparados para exportação'
                });

            default:
                return NextResponse.json(
                    { success: false, error: 'Ação inválida' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            message,
            count: result?.count || 0
        });

    } catch (error) {
        console.error('Erro ao executar ação em massa:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao executar ação' },
            { status: 500 }
        );
    }
}

// GET - Buscar dados para email/whatsapp em massa
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const ids = searchParams.get('ids')?.split(',') || [];

        if (ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'IDs não fornecidos' },
                { status: 400 }
            );
        }

        // ✅ INCLUIR COMBO NA CONSULTA
        const appointments = await prisma.appointment.findMany({
            where: {
                id: { in: ids }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                service: {
                    select: {
                        name: true
                    }
                },
                combo: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Agrupar emails e telefones únicos
        const emails = [...new Set(appointments.map(a => a.user.email).filter(Boolean))];
        const phones = [...new Set(appointments.map(a => a.user.phone).filter(Boolean))];

        return NextResponse.json({
            success: true,
            data: {
                appointments,
                contacts: {
                    emails,
                    phones
                }
            }
        });

    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar dados' },
            { status: 500 }
        );
    }
}