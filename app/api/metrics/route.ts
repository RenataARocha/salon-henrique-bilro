// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const agora = new Date()
        const proximosDias = addDays(agora, 7)

        // Buscar métricas do banco
        const [
            agendamentosConfirmados,
            agendamentosPendentes,
            cuponsAtivos,
            clientesAtivos,
            proximosAgendamentos,
            totalNotificacoes
        ] = await Promise.all([
            // Agendamentos confirmados
            prisma.appointment.count({
                where: { status: 'CONFIRMED' }
            }),

            // Agendamentos pendentes
            prisma.appointment.count({
                where: { status: 'PENDING' }
            }),

            // Cupons ativos
            prisma.coupon.count({
                where: {
                    active: true,
                    validUntil: { gte: agora }
                }
            }),

            // Clientes ativos
            prisma.user.count({
                where: { role: 'CLIENT' }
            }),

            // Agendamentos próximos 7 dias
            prisma.appointment.count({
                where: {
                    date: {
                        gte: agora,
                        lte: proximosDias
                    }
                }
            }),

            // Total de notificações enviadas (aproximação)
            prisma.notification.count()
        ])

        // Calcular taxa de confirmação
        const totalAgendamentos = agendamentosConfirmados + agendamentosPendentes
        const taxaConfirmacao = totalAgendamentos > 0
            ? Math.round((agendamentosConfirmados / totalAgendamentos) * 100)
            : 0

        const metricas = {
            whatsappEnviados: Math.floor(totalNotificacoes * 0.8), // Estimativa: 80% WhatsApp
            emailsEnviados: Math.floor(totalNotificacoes * 0.6), // Estimativa: 60% Email
            agendamentosConfirmados,
            agendamentosPendentes,
            taxaConfirmacao,
            cuponsAtivos,
            clientesAtivos,
            proximosAgendamentos
        }

        return NextResponse.json({
            success: true,
            metricas
        })
    } catch (error) {
        console.error('Erro ao buscar métricas:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar métricas' },
            { status: 500 }
        )
    }
}