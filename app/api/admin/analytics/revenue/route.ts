// app/api/admin/analytics/revenue/route.ts

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
        const period = searchParams.get('period') || 'month'; // today, week, month, year, custom
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Calcular datas
        const now = new Date();
        let dateFilter: any = {};

        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateFilter = { gte: today };
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            dateFilter = { gte: weekAgo };
        } else if (period === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            dateFilter = { gte: monthAgo };
        } else if (period === 'year') {
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateFilter = { gte: yearAgo };
        } else if (period === 'custom' && startDate && endDate) {
            dateFilter = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Buscar agendamentos concluídos
        const appointments = await prisma.appointment.findMany({
            where: {
                date: dateFilter,
                status: 'COMPLETED'
            },
            include: {
                service: {
                    select: {
                        name: true,
                        price: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Calcular métricas
        const totalRevenue = appointments.reduce((sum, apt) => {
            const price = apt.finalPrice || apt.service?.price || 0;
            return sum + price;
        }, 0);

        const totalDiscount = appointments.reduce((sum, apt) => {
            return sum + (apt.discountAmount || 0);
        }, 0);

        const totalAppointments = appointments.length;

        // Receita por dia (últimos 30 dias)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
        });

        const revenueByDay = last30Days.map(date => {
            const dayAppointments = appointments.filter(apt =>
                apt.date.toISOString().split('T')[0] === date
            );

            const revenue = dayAppointments.reduce((sum, apt) => {
                const price = apt.finalPrice || apt.service?.price || 0;
                return sum + price;
            }, 0);

            return {
                date,
                revenue,
                appointments: dayAppointments.length
            };
        });

        // Serviços mais vendidos
        const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};

        appointments.forEach(apt => {
            const serviceName = apt.service?.name || 'Combo';
            if (!serviceCount[serviceName]) {
                serviceCount[serviceName] = {
                    name: serviceName,
                    count: 0,
                    revenue: 0
                };
            }
            serviceCount[serviceName].count++;
            serviceCount[serviceName].revenue += apt.finalPrice || apt.service?.price || 0;
        });

        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Horários de pico
        const hourCount: Record<string, number> = {};

        appointments.forEach(apt => {
            const hour = apt.time.split(':')[0];
            hourCount[hour] = (hourCount[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourCount)
            .map(([hour, count]) => ({
                hour: `${hour}:00`,
                appointments: count
            }))
            .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

        // Comparativo mensal (últimos 12 meses)
        const monthlyRevenue = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthAppointments = await prisma.appointment.findMany({
                where: {
                    date: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    status: 'COMPLETED'
                },
                include: {
                    service: true
                }
            });

            const revenue = monthAppointments.reduce((sum, apt) => {
                return sum + (apt.finalPrice || apt.service?.price || 0);
            }, 0);

            monthlyRevenue.push({
                month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                revenue,
                appointments: monthAppointments.length
            });
        }

        // Calcular comparativos
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayRevenue = await calculateRevenue(yesterday, yesterday);
        const todayRevenue = await calculateRevenue(now, now);

        const lastWeekRevenue = await calculateRevenue(
            new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        );

        const thisWeekRevenue = await calculateRevenue(
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            now
        );

        const lastMonthRevenue = await calculateRevenue(
            new Date(now.getFullYear(), now.getMonth() - 2, 1),
            new Date(now.getFullYear(), now.getMonth() - 1, 0)
        );

        const thisMonthRevenue = await calculateRevenue(
            new Date(now.getFullYear(), now.getMonth(), 1),
            now
        );

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalRevenue,
                    totalDiscount,
                    totalAppointments,
                    averageTicket: totalAppointments > 0 ? totalRevenue / totalAppointments : 0,
                },
                comparisons: {
                    today: {
                        revenue: todayRevenue,
                        change: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
                    },
                    week: {
                        revenue: thisWeekRevenue,
                        change: lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0
                    },
                    month: {
                        revenue: thisMonthRevenue,
                        change: lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
                    }
                },
                charts: {
                    revenueByDay,
                    topServices,
                    peakHours,
                    monthlyRevenue
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar analytics:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar analytics' },
            { status: 500 }
        );
    }
}

// Helper function
async function calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    const appointments = await prisma.appointment.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            },
            status: 'COMPLETED'
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
            }
        }
    });

    return appointments.reduce((sum, apt) => {
        return sum + (apt.finalPrice || apt.service?.price || 0);
    }, 0);
}