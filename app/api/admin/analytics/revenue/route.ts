// app/api/admin/analytics/revenue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ FUNÇÃO AUXILIAR PARA CALCULAR PREÇO (aceita combo)
function getAppointmentPrice(apt: any): number {
    if (apt.finalPrice) return apt.finalPrice;

    if (apt.combo) {
        const originalPrice = apt.combo.services.reduce(
            (sum: number, cs: any) => sum + cs.service.price,
            0
        );
        return originalPrice * (1 - apt.combo.discountPercent / 100);
    }

    if (apt.service) return apt.service.price;

    return 0;
}

// ✅ FUNÇÃO AUXILIAR PARA PEGAR NOME DO SERVIÇO/COMBO
function getAppointmentName(apt: any): string {
    return apt.combo?.name || apt.service?.name || 'Serviço não identificado';
}

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
        const period = searchParams.get('period') || 'month';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('💰 Gerando dashboard financeiro:', { period });

        // Calcular datas
        const now = new Date();
        let dateFilter: any = {};

        // ✅ MODO DEBUG: Se period for 'all', busca tudo
        if (period === 'all') {
            dateFilter = {}; // Sem filtro de data
            console.log('🌐 MODO DEBUG: Buscando TODOS os agendamentos');
        } else if (period === 'today') {
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

        // ✅ Buscar agendamentos concluídos COM COMBO
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
                combo: {
                    select: {
                        name: true,
                        discountPercent: true,
                        services: {
                            include: {
                                service: {
                                    select: {
                                        name: true,
                                        price: true
                                    }
                                }
                            }
                        }
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

        console.log(`📅 Agendamentos COMPLETED encontrados: ${appointments.length}`);

        // ✅ MOSTRAR DATAS DOS AGENDAMENTOS
        if (appointments.length > 0) {
            console.log('📋 Datas dos agendamentos COMPLETED:');
            appointments.forEach(apt => {
                console.log(`   - ${new Date(apt.date).toLocaleDateString('pt-BR')} às ${apt.time} - R$ ${getAppointmentPrice(apt).toFixed(2)}`);
            });
        }

        // ✅ Calcular métricas usando a função auxiliar
        const totalRevenue = appointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0);

        const totalDiscount = appointments.reduce((sum, apt) => sum + (apt.discountAmount || 0), 0);

        const totalAppointments = appointments.length;

        console.log(`💰 Receita total: R$ ${totalRevenue.toFixed(2)}`);
        console.log(`💸 Descontos: R$ ${totalDiscount.toFixed(2)}`);

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

            const revenue = dayAppointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0);

            return {
                date,
                revenue,
                appointments: dayAppointments.length
            };
        });

        // ✅ Serviços mais vendidos (incluindo combos)
        const serviceCount: Record<string, { name: string; count: number; revenue: number }> = {};

        appointments.forEach(apt => {
            const serviceName = getAppointmentName(apt);

            if (!serviceCount[serviceName]) {
                serviceCount[serviceName] = {
                    name: serviceName,
                    count: 0,
                    revenue: 0
                };
            }
            serviceCount[serviceName].count++;
            serviceCount[serviceName].revenue += getAppointmentPrice(apt);
        });

        const topServices = Object.values(serviceCount)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        console.log(`🏆 Top serviços:`, topServices.slice(0, 3).map(s => `${s.name} (${s.count}x)`));

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
                    service: true,
                    combo: {
                        select: {
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

            const revenue = monthAppointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0);

            monthlyRevenue.push({
                month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                revenue,
                appointments: monthAppointments.length
            });
        }

        // Calcular comparativos
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('📅 Calculando receita de HOJE:', today.toLocaleDateString('pt-BR'));
        const yesterdayRevenue = await calculateRevenue(yesterday, yesterdayEnd);
        const todayRevenue = await calculateRevenue(today, now);
        console.log(`💰 Receita hoje: R$ ${todayRevenue.toFixed(2)} | Ontem: R$ ${yesterdayRevenue.toFixed(2)}`);

        const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // ✅ Próximos 7 dias também

        console.log('📅 Calculando receita da SEMANA:', thisWeekStart.toLocaleDateString('pt-BR'), 'até', thisWeekEnd.toLocaleDateString('pt-BR'));
        const lastWeekRevenue = await calculateRevenue(lastWeekStart, lastWeekEnd);
        const thisWeekRevenue = await calculateRevenue(thisWeekStart, thisWeekEnd); // ✅ Inclui próximos 7 dias
        console.log(`💰 Receita esta semana: R$ ${thisWeekRevenue.toFixed(2)} | Semana passada: R$ ${lastWeekRevenue.toFixed(2)}`);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // ✅ Fim do mês atual

        console.log('📅 Calculando receita do MÊS:', thisMonthStart.toLocaleDateString('pt-BR'), 'até', thisMonthEnd.toLocaleDateString('pt-BR'));
        const lastMonthRevenue = await calculateRevenue(lastMonthStart, lastMonthEnd);
        const thisMonthRevenue = await calculateRevenue(thisMonthStart, thisMonthEnd); // ✅ Até fim do mês
        console.log(`💰 Receita este mês: R$ ${thisMonthRevenue.toFixed(2)} | Mês passado: R$ ${lastMonthRevenue.toFixed(2)}`);

        console.log('📊 Comparativos:', {
            hoje: todayRevenue,
            ontem: yesterdayRevenue,
            estaSemana: thisWeekRevenue,
            semanaPassada: lastWeekRevenue,
            esteMes: thisMonthRevenue,
            mesPassado: lastMonthRevenue
        });

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
        console.error('❌ Erro ao buscar analytics:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar analytics' },
            { status: 500 }
        );
    }
}

// ✅ Helper function CORRIGIDA
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
                select: {
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

    return appointments.reduce((sum, apt) => sum + getAppointmentPrice(apt), 0);
}