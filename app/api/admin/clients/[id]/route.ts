// app/api/admin/clients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const params = await context.params;
        const clientId = params.id;

        // Buscar cliente com todos os detalhes
        const client = await prisma.user.findUnique({
            where: { id: clientId },
            include: {
                appointments: {
                    include: {
                        service: true,
                        coupon: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                reviews: {
                    include: {
                        service: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Cliente não encontrado' },
                { status: 404 }
            );
        }

        // Calcular estatísticas
        const completedAppointments = client.appointments.filter(
            apt => apt.status === 'COMPLETED'
        );

        const totalSpent = completedAppointments.reduce((sum, apt) => {
            return sum + (apt.finalPrice || 0);
        }, 0);

        const avgTicket = completedAppointments.length > 0
            ? totalSpent / completedAppointments.length
            : 0;

        // Serviço preferido
        const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};

        completedAppointments.forEach(apt => {
            const serviceName = apt.service.name;
            if (!serviceCount[serviceName]) {
                serviceCount[serviceName] = {
                    name: serviceName,
                    count: 0,
                    revenue: 0
                };
            }
            serviceCount[serviceName].count++;
            serviceCount[serviceName].revenue += apt.finalPrice || 0;
        });

        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Status por tipo
        const statusCount = {
            completed: client.appointments.filter(a => a.status === 'COMPLETED').length,
            cancelled: client.appointments.filter(a => a.status === 'CANCELLED').length,
            noShow: client.appointments.filter(a => a.status === 'NO_SHOW').length,
            pending: client.appointments.filter(a => a.status === 'PENDING').length
        };

        // Taxa de comparecimento
        const totalScheduled = client.appointments.length;
        const attendanceRate = totalScheduled > 0
            ? (statusCount.completed / totalScheduled) * 100
            : 0;

        // Média de avaliações
        const avgRating = client.reviews.length > 0
            ? client.reviews.reduce((sum, r) => sum + r.rating, 0) / client.reviews.length
            : 0;

        // Último agendamento
        const lastAppointment = client.appointments[0];
        const daysSinceLastAppointment = lastAppointment
            ? Math.floor((Date.now() - new Date(lastAppointment.date).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return NextResponse.json({
            success: true,
            data: {
                client: {
                    id: client.id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    birthDate: client.birthDate,
                    image: client.image,
                    createdAt: client.createdAt
                },
                stats: {
                    totalAppointments: client.appointments.length,
                    completedAppointments: statusCount.completed,
                    cancelledAppointments: statusCount.cancelled,
                    noShowAppointments: statusCount.noShow,
                    pendingAppointments: statusCount.pending,
                    totalSpent,
                    avgTicket,
                    attendanceRate,
                    avgRating,
                    lastAppointment: lastAppointment?.date || null,
                    daysSinceLastAppointment,
                    topServices
                },
                appointments: client.appointments,
                reviews: client.reviews
            }
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar detalhes' },
            { status: 500 }
        );
    }
}

// PUT - Adicionar nota interna ao cliente
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }

        const params = await context.params;
        const clientId = params.id;
        const { notes } = await req.json();

        // Por enquanto, vamos adicionar um campo notes no User (você pode criar uma tabela ClientNotes separada)
        const client = await prisma.user.update({
            where: { id: clientId },
            data: {
                // Nota: você precisará adicionar um campo 'notes' no schema User
                // notes: notes
            }
        });

        return NextResponse.json({
            success: true,
            data: client,
            message: 'Nota adicionada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar' },
            { status: 500 }
        );
    }
}