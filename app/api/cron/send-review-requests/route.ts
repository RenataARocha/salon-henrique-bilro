import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-3c9c.up.railway.app'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'
const SITE_URL = process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'

function normalizePhone(phone: string): string {
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 13 && clean.startsWith('5584')) return clean.slice(0, 4) + clean.slice(5)
    if (clean.length === 12) return clean
    if (clean.length === 11 && clean.startsWith('84')) return '55' + clean.slice(0, 2) + clean.slice(3)
    if (clean.length === 10) return '55' + clean
    if (clean.length === 8) return '5584' + clean
    return clean
}

async function sendWhatsApp(phone: string, message: string) {
    try {
        const numero = normalizePhone(phone)
        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({ number: numero, text: message })
            }
        )
        return response.ok
    } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp:', error)
        return false
    }
}

export async function GET(req: NextRequest) {
    try {
        // Verificar autorização do cron
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        console.log('🔔 Cron de avaliações iniciado...')

        // Buscar agendamentos concluídos nas últimas 24h
        // que ainda não receberam pedido de avaliação
        const agora = new Date()
        const ontemMesmaHora = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

        const agendamentos = await prisma.appointment.findMany({
            where: {
                status: 'COMPLETED',
                reviewRequestSentAt: null, // Ainda não enviou
                updatedAt: {
                    gte: ontemMesmaHora // Concluído nas últimas 24h
                },
                review: null // Ainda não foi avaliado
            },
            include: {
                user: true,
                service: true,
                combo: true
            }
        })

        console.log(`📋 Encontrados ${agendamentos.length} agendamentos para enviar pedido de avaliação`)

        let enviados = 0
        let erros = 0

        for (const agendamento of agendamentos) {
            if (!agendamento.user.phone) {
                console.log(`⚠️ Cliente sem telefone: ${agendamento.user.name}`)
                continue
            }

            const serviceName = agendamento.service?.name || agendamento.combo?.name || 'serviço'
            const reviewLink = `${SITE_URL}/avaliar/${agendamento.id}`

            const message = `
✨ *Olá, ${agendamento.user.name}!*

Esperamos que tenha adorado o atendimento de hoje! 💅

Sua opinião é muito importante para nós. Que tal deixar uma avaliação rápida sobre o seu *${serviceName}*?

⭐ *Avalie seu atendimento:*
${reviewLink}

Leva menos de 1 minuto e nos ajuda muito! 🙏

Obrigada pela preferência!
*Equipe Henrique Bilro Cabeleireiros* 💕
            `.trim()

            const enviado = await sendWhatsApp(agendamento.user.phone, message)

            if (enviado) {
                // Marcar que enviou
                await prisma.appointment.update({
                    where: { id: agendamento.id },
                    data: { reviewRequestSentAt: new Date() }
                })
                enviados++
                console.log(`✅ Pedido enviado para: ${agendamento.user.name}`)
            } else {
                erros++
                console.log(`❌ Erro ao enviar para: ${agendamento.user.name}`)
            }

            // Delay de 3s entre envios
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        console.log(`✅ Cron finalizado: ${enviados} enviados, ${erros} erros`)

        return NextResponse.json({
            success: true,
            enviados,
            erros,
            total: agendamentos.length
        })

    } catch (error) {
        console.error('❌ Erro no cron:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}