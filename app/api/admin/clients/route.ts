// app/api/admin/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        const search = searchParams.get('search') || '';
        const segment = searchParams.get('segment'); // vip, new, inactive, birthday

        // Filtros
        let where: any = {
            role: 'CLIENT'
        };

        // Busca
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Buscar clientes
        const clients = await prisma.user.findMany({
            where,
            include: {
                appointments: {
                    where: {
                        status: 'COMPLETED'
                    },
                    include: {
                        service: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                },
                _count: {
                    select: {
                        appointments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calcular estatísticas para cada cliente
        const clientsWithStats = clients.map(client => {
            const completedAppointments = client.appointments;

            const totalSpent = completedAppointments.reduce((sum, apt) => {
                return sum + (apt.finalPrice || apt.service.price);
            }, 0);

            const avgTicket = completedAppointments.length > 0
                ? totalSpent / completedAppointments.length
                : 0;

            const lastAppointment = completedAppointments[0];
            const lastAppointmentDate = lastAppointment?.date || null;

            // Calcular dias desde último agendamento
            const daysSinceLastAppointment = lastAppointmentDate
                ? Math.floor((Date.now() - new Date(lastAppointmentDate).getTime()) / (1000 * 60 * 60 * 24))
                : null;

            // Serviço preferido
            const serviceCount: Record<string, number> = {};
            completedAppointments.forEach(apt => {
                const serviceName = apt.service.name;
                serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
            });

            const favoriteService = Object.entries(serviceCount)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

            // Taxa de comparecimento
            const allAppointments = client._count.appointments;
            const attendanceRate = allAppointments > 0
                ? (completedAppointments.length / allAppointments) * 100
                : 0;

            // Segmentação
            const isVIP = totalSpent > 5000;
            const isNew = client.createdAt > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 6 meses
            const isInactive = daysSinceLastAppointment !== null && daysSinceLastAppointment > 90;

            const isBirthdayThisMonth = client.birthDate
                ? new Date(client.birthDate).getMonth() === new Date().getMonth()
                : false;

            return {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                birthDate: client.birthDate,
                image: client.image,
                createdAt: client.createdAt,
                stats: {
                    totalAppointments: completedAppointments.length,
                    totalSpent,
                    avgTicket,
                    lastAppointment: lastAppointmentDate,
                    daysSinceLastAppointment,
                    favoriteService,
                    attendanceRate
                },
                segments: {
                    isVIP,
                    isNew,
                    isInactive,
                    isBirthdayThisMonth
                }
            };
        });

        // Filtrar por segmento se solicitado
        let filteredClients = clientsWithStats;

        if (segment === 'vip') {
            filteredClients = clientsWithStats.filter(c => c.segments.isVIP);
        } else if (segment === 'new') {
            filteredClients = clientsWithStats.filter(c => c.segments.isNew);
        } else if (segment === 'inactive') {
            filteredClients = clientsWithStats.filter(c => c.segments.isInactive);
        } else if (segment === 'birthday') {
            filteredClients = clientsWithStats.filter(c => c.segments.isBirthdayThisMonth);
        }

        // Estatísticas gerais
        const totalClients = clientsWithStats.length;
        const vipClients = clientsWithStats.filter(c => c.segments.isVIP).length;
        const newClients = clientsWithStats.filter(c => c.segments.isNew).length;
        const inactiveClients = clientsWithStats.filter(c => c.segments.isInactive).length;
        const birthdayClients = clientsWithStats.filter(c => c.segments.isBirthdayThisMonth).length;

        return NextResponse.json({
            success: true,
            data: filteredClients,
            summary: {
                total: totalClients,
                vip: vipClients,
                new: newClients,
                inactive: inactiveClients,
                birthday: birthdayClients
            }
        });
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar clientes' },
            { status: 500 }
        );
    }
}