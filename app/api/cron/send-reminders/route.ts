// app/api/cron/send-reminders/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyAppointmentReminder } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    try {
        // Verificar autorização
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        console.log('⏰ Cron de lembretes iniciado...')

        // Calcular intervalo de "amanhã" em UTC
        const agora = new Date()
        const amanha = new Date(agora)
        amanha.setUTCDate(amanha.getUTCDate() + 1)
        amanha.setUTCHours(0, 0, 0, 0)

        const amanhaFim = new Date(amanha)
        amanhaFim.setUTCHours(23, 59, 59, 999)

        console.log(`📅 Buscando agendamentos de: ${amanha.toISOString()} até ${amanhaFim.toISOString()}`)

        // Buscar agendamentos de amanhã que ainda não receberam lembrete
        const agendamentos = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: amanha,
                    lte: amanhaFim
                },
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            include: {
                user: true,
                service: true,
                combo: true
            }
        })

        console.log(`📋 ${agendamentos.length} agendamento(s) para amanhã`)

        let enviados = 0
        let erros = 0
        let semTelefone = 0

        for (const agendamento of agendamentos) {
            if (!agendamento.user.phone) {
                console.log(`⚠️ Sem telefone: ${agendamento.user.name}`)
                semTelefone++
                continue
            }

            try {
                await notifyAppointmentReminder({
                    id: agendamento.id,
                    user: agendamento.user,
                    service: agendamento.service || {
                        name: agendamento.combo?.name || 'Serviço',
                        price: agendamento.finalPrice
                    },
                    date: agendamento.date,
                    time: agendamento.time
                })

                enviados++
                console.log(`✅ Lembrete enviado: ${agendamento.user.name} — ${agendamento.time}`)

                // Delay entre envios para não sobrecarregar a Evolution API
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (err) {
                erros++
                console.error(`❌ Erro ao enviar para ${agendamento.user.name}:`, err)
            }
        }

        console.log(`✅ Cron de lembretes finalizado: ${enviados} enviados, ${erros} erros, ${semTelefone} sem telefone`)

        return NextResponse.json({
            success: true,
            enviados,
            erros,
            semTelefone,
            total: agendamentos.length
        })

    } catch (error) {
        console.error('❌ Erro no cron de lembretes:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}