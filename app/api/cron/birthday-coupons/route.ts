// app/api/cron/birthday-coupons/route.ts
// Roda todo dia às 9h — processa aniversários do dia e notifica sobre os de amanhã

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toZonedTime } from 'date-fns-tz'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'

function normalizePhone(phone: string): string {
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 13 && clean.startsWith('5584')) return clean.slice(0, 4) + clean.slice(5)
    if (clean.length === 12) return clean
    if (clean.length === 11 && clean.startsWith('84')) return '55' + clean.slice(0, 2) + clean.slice(3)
    if (clean.length === 10) return '55' + clean
    if (clean.length === 8) return '5584' + clean
    return clean
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
    try {
        const numero = normalizePhone(phone)
        const res = await fetch(
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
        return res.ok
    } catch {
        return false
    }
}

async function createOrUpdateCoupon(user: { id: string; name: string }, settings: {
    birthdayDiscountType: string
    birthdayDiscountValue: number
    birthdayValidDays: number
}) {
    const firstName = user.name.split(' ')[0].toUpperCase()
    const code = `ANIVERSARIO-${firstName}-${new Date().getFullYear()}`

    const couponData = {
        description: `Cupom de aniversário para ${user.name}`,
        discountType: settings.birthdayDiscountType,
        discountValue: settings.birthdayDiscountValue,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + settings.birthdayValidDays * 24 * 60 * 60 * 1000),
        active: true,
        maxUses: 1,
        usedCount: 0,
    }

    return await prisma.coupon.upsert({
        where: { code },
        update: couponData,
        create: { code, ...couponData }
    })
}

async function notifyAdmin(title: string, message: string) {
    try {
        // Buscar todos os admins
        const admins = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
            select: { id: true }
        })

        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    userId: admin.id,
                    title,
                    message,
                    type: 'INFO'
                }
            })
        }
    } catch (error) {
        console.error('Erro ao notificar admin:', error)
    }
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        console.log('🎂 Cron de aniversários iniciado...')

        // Buscar configurações
        const settings = await prisma.salonSettings.findUnique({
            where: { id: 'singleton' }
        })



        const timeZone = 'America/Sao_Paulo'

        const hoje = toZonedTime(new Date(), timeZone)

        const amanha = new Date(hoje)
        amanha.setDate(hoje.getDate() + 1)

        const diaHoje = hoje.getDate()
        const mesHoje = hoje.getMonth() + 1

        const diaAmanha = amanha.getDate()
        const mesAmanha = amanha.getMonth() + 1

        // Buscar todos os usuários com aniversário
        const usuarios = await prisma.user.findMany({
            where: { birthDate: { not: null }, role: 'CLIENT' },
            select: { id: true, name: true, email: true, phone: true, birthDate: true }
        })

        // Aniversariantes de hoje
        const aniversariantesHoje = usuarios.filter(u => {
            const d = new Date(u.birthDate!)
            return d.getUTCDate() === diaHoje && d.getUTCMonth() + 1 === mesHoje
        })

        // Aniversariantes de amanhã
        const aniversariantesAmanha = usuarios.filter(u => {
            const d = new Date(u.birthDate!)
            return d.getUTCDate() === diaAmanha && d.getUTCMonth() + 1 === mesAmanha
        })

        let cuponsEnviados = 0
        let notificacoesAdmin = 0

        // ── MODO AUTOMÁTICO ──────────────────────────────────────────────────
        if (settings?.birthdayAutoEnabled) {

            // 1. Envia cupom pelo WhatsApp para aniversariantes de HOJE
            for (const user of aniversariantesHoje) {
                if (!user.phone) continue

                try {
                    const coupon = await createOrUpdateCoupon(user, settings)

                    const discount = settings.birthdayDiscountType === 'PERCENTAGE'
                        ? `${settings.birthdayDiscountValue}% de desconto`
                        : `R$ ${settings.birthdayDiscountValue.toFixed(2)} de desconto`

                    const message = settings.birthdayMessage
                        ? settings.birthdayMessage
                            .replace('{nome}', user.name.split(' ')[0])
                            .replace('{desconto}', discount)
                            .replace('{codigo}', coupon.code)
                            .replace('{validade}', `${settings.birthdayValidDays} dias`)
                        : `🎂 *Feliz Aniversário, ${user.name.split(' ')[0]}!*\n\nO Henrique Bilro Cabeleireiros tem um presente especial para você! 🎁\n\n✨ *${discount}* no seu próximo atendimento!\n\n🎫 *Cupom:* \`${coupon.code}\`\n📅 *Válido por ${settings.birthdayValidDays} dias*\n\nAproveite e venha nos visitar! 💕\n\n👉 Agende em: https://salon-henrique-bilro.vercel.app`

                    const enviado = await sendWhatsApp(user.phone, message)
                    if (enviado) {
                        cuponsEnviados++
                        console.log(`✅ Cupom enviado para ${user.name}`)
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000))
                } catch (err) {
                    console.error(`❌ Erro ao enviar para ${user.name}:`, err)
                }
            }

            // 2. Notifica admin 1 dia antes informando que vai enviar amanhã
            if (aniversariantesAmanha.length > 0) {
                const nomes = aniversariantesAmanha.map(u => u.name).join(', ')
                await notifyAdmin(
                    '🎂 Cupons de aniversário serão enviados amanhã',
                    `O sistema enviará automaticamente cupons de aniversário amanhã para: ${nomes}. O modo automático está ativo.`
                )
                notificacoesAdmin++
            }

        } else {
            // ── MODO MANUAL ──────────────────────────────────────────────────

            // Notifica admin 1 dia antes para enviar manualmente
            if (aniversariantesAmanha.length > 0) {
                const nomes = aniversariantesAmanha.map(u => u.name).join(', ')
                await notifyAdmin(
                    '🎂 Clientes fazem aniversário amanhã!',
                    `Lembrete: ${nomes} ${aniversariantesAmanha.length === 1 ? 'faz' : 'fazem'} aniversário amanhã. Acesse Aniversariantes para enviar uma oferta especial!`
                )
                notificacoesAdmin++
            }

            // Notifica sobre aniversariantes de hoje que ainda não receberam oferta
            if (aniversariantesHoje.length > 0) {
                const nomes = aniversariantesHoje.map(u => u.name).join(', ')
                await notifyAdmin(
                    '🎉 Clientes fazem aniversário HOJE!',
                    `${nomes} ${aniversariantesHoje.length === 1 ? 'está fazendo' : 'estão fazendo'} aniversário hoje! Não esqueça de enviar uma oferta especial.`
                )
                notificacoesAdmin++
            }
        }

        console.log(`✅ Cron de aniversários finalizado: ${cuponsEnviados} cupons enviados, ${notificacoesAdmin} notificações`)

        return NextResponse.json({
            success: true,
            cuponsEnviados,
            notificacoesAdmin,
            aniversariantesHoje: aniversariantesHoje.length,
            aniversariantesAmanha: aniversariantesAmanha.length,
            modoAutomatico: settings?.birthdayAutoEnabled ?? false
        })

    } catch (error) {
        console.error('❌ Erro no cron de aniversários:', error)
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}