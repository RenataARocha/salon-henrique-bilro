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

        const completedAppointments = client.appointments.filter(
            apt => apt.status === 'COMPLETED'
        );

        // CORREÇÃO: Usa finalPrice ou service.price
        const totalSpent = completedAppointments.reduce((sum, apt) => {
            return sum + (apt.finalPrice ?? apt.service.price);
        }, 0);

        const avgTicket = completedAppointments.length > 0
            ? totalSpent / completedAppointments.length
            : 0;

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
            serviceCount[serviceName].revenue += apt.finalPrice ?? apt.service.price;
        });

        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const statusCount = {
            completed: client.appointments.filter(a => a.status === 'COMPLETED').length,
            cancelled: client.appointments.filter(a => a.status === 'CANCELLED').length,
            noShow: client.appointments.filter(a => a.status === 'NO_SHOW').length,
            pending: client.appointments.filter(a => a.status === 'PENDING').length
        };

        const totalScheduled = client.appointments.length;
        const attendanceRate = totalScheduled > 0
            ? (statusCount.completed / totalScheduled) * 100
            : 0;

        const avgRating = client.reviews.length > 0
            ? client.reviews.reduce((sum, r) => sum + r.rating, 0) / client.reviews.length
            : 0;

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

// CORREÇÃO: Adicionado método PATCH para editar cliente
export async function PATCH(
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
        const body = await req.json();

        const { name, email, phone, birthDate } = body;

        // Preparar dados para atualização
        const updateData: any = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;

        // CORREÇÃO: Aceitar data no formato ISO que vem do frontend
        if (birthDate) {
            // Se vier no formato ISO (já convertido no frontend), usar direto
            updateData.birthDate = birthDate;
        }

        const updatedClient = await prisma.user.update({
            where: { id: clientId },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            data: updatedClient,
            message: 'Cliente atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar cliente' },
            { status: 500 }
        );
    }
}