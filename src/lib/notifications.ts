// src/lib/notifications.ts
// Sistema completo de notificações: WhatsApp + Email + Sistema

import {
    sendAppointmentConfirmationEmail,
    sendAppointmentReminderEmail,
    sendBirthdayEmail
} from './email/notificationEmails'
import { prisma } from './prisma'

// ============================================
// CONFIGURAÇÃO DA EVOLUTION API
// ============================================
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-3c9c.up.railway.app'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'
const SITE_URL = process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'

// ============================================
// NORMALIZAR TELEFONE (aceita com/sem 9)
// ============================================
function normalizePhone(phone: string): string {
    const clean = phone.replace(/\D/g, '')

    if (clean.length === 13 && clean.startsWith('5584')) {
        return clean.slice(0, 4) + clean.slice(5)
    }
    if (clean.length === 12) {
        return clean
    }
    if (clean.length === 11 && clean.startsWith('84')) {
        return '55' + clean.slice(0, 2) + clean.slice(3)
    }
    if (clean.length === 10) {
        return '55' + clean
    }
    if (clean.length === 8) {
        return '5584' + clean
    }

    return clean
}

// ============================================
// FUNÇÃO PARA ENVIAR WHATSAPP (EVOLUTION API)
// ============================================
async function sendWhatsApp(phone: string, message: string) {
    try {
        const numero = normalizePhone(phone)

        console.log('📱 Enviando WhatsApp via Evolution API:', { original: phone, normalizado: numero })

        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: numero,
                    text: message
                })
            }
        )

        if (!response.ok) {
            console.error('❌ Erro ao enviar WhatsApp:', response.statusText)
            return { success: false }
        }

        const data = await response.json()
        console.log('✅ WhatsApp enviado com sucesso para:', numero)
        return { success: true, data }

    } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp:', error)
        return { success: false, error }
    }
}

// ============================================
// FUNÇÃO PARA CRIAR NOTIFICAÇÃO NO SISTEMA
// ============================================
async function createNotification(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                read: false
            }
        })
        return { success: true }
    } catch (error) {
        console.error('❌ Erro ao criar notificação:', error)
        return { success: false }
    }
}

// ============================================
// 1. AGENDAMENTO CRIADO
// ============================================
export async function notifyAppointmentCreated(appointment: any) {
    const { user, service, date, time, id } = appointment
    const dateFormatted = new Date(date).toLocaleDateString('pt-BR')
    const confirmToken = Buffer.from(`${id}:${Date.now()}`).toString('base64')
    const confirmUrl = `${SITE_URL}/api/appointments/confirm?id=${id}&token=${confirmToken}`

    const whatsappMessage = `
🎉 *Agendamento Confirmado!*

Olá ${user.name}! ✨

Seu agendamento foi realizado com sucesso:

📅 *Data:* ${dateFormatted}
⏰ *Horário:* ${time}
💅 *Serviço:* ${service.name}
💰 *Valor:* R$ ${service.price.toFixed(2)}

📍 *Local:* Henrique Bilro Cabeleireiros
Av. Rio Doce, 3101 – Potengi, Natal/RN

⚠️ *Importante:*
- Chegar 10 minutos antes
- Cancelamentos com 24h de antecedência

👉 *CONFIRME SUA PRESENÇA:*
${confirmUrl}

Nos vemos lá! 😊
    `.trim()

    if (user.phone) await sendWhatsApp(user.phone, whatsappMessage)

    await sendAppointmentConfirmationEmail({
        to: user.email,
        name: user.name,
        service: service.name,
        date: dateFormatted,
        time: time,
        price: service.price,
        appointmentId: id
    })

    await createNotification(
        user.id,
        'Agendamento Criado',
        `Seu agendamento para ${service.name} foi confirmado para ${dateFormatted} às ${time}`,
        'SUCCESS'
    )
}

// ============================================
// 2. LEMBRETE 48H ANTES
// ============================================
export async function notifyAppointmentReminder(appointment: any) {
    const { user, service, date, time, id } = appointment
    const dateFormatted = new Date(date).toLocaleDateString('pt-BR')
    const confirmToken = Buffer.from(`${id}:${Date.now()}`).toString('base64')
    const confirmUrl = `${SITE_URL}/api/appointments/confirm?id=${id}&token=${confirmToken}`

    const whatsappMessage = `
⏰ *Lembrete de Agendamento*

Oi ${user.name}! 👋

Lembrando que você tem agendamento amanhã:

📅 ${dateFormatted} às ${time}
💅 ${service.name}

📍 Av. Rio Doce, 3101 – Potengi

👉 *CONFIRME SUA PRESENÇA:*
${confirmUrl}

Caso precise cancelar, faça com 24h de antecedência! 📞

Te esperamos! ✨
    `.trim()

    if (user.phone) await sendWhatsApp(user.phone, whatsappMessage)

    await sendAppointmentReminderEmail({
        to: user.email,
        name: user.name,
        service: service.name,
        date: dateFormatted,
        time: time,
        appointmentId: id
    })

    await createNotification(
        user.id,
        '⏰ Lembrete de Agendamento',
        `Seu agendamento é amanhã às ${time}`,
        'WARNING'
    )
}

// ============================================
// 3. CUPOM DE ANIVERSÁRIO
// ============================================
export async function notifyBirthdayCoupon(user: any, coupon: any) {
    if (user.phone) {
        const whatsappMessage = `
🎂🎉 *FELIZ ANIVERSÁRIO, ${user.name.toUpperCase()}!* 🎉🎂

A equipe Henrique Bilro deseja um dia incrível! 💖

🎁 *PRESENTE ESPECIAL:*

Cupom: *${coupon.code}*
Desconto: *${coupon.discountValue}%*
Válido até: ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}

✨ Use no seu próximo agendamento e aproveite!

Agende pelo site: ${SITE_URL}

Com carinho,
Equipe Henrique Bilro 💕
        `.trim()

        await sendWhatsApp(user.phone, whatsappMessage)
    }

    await sendBirthdayEmail({
        to: user.email,
        name: user.name,
        couponCode: coupon.code,
        discountValue: coupon.discountValue,
        expiresAt: new Date(coupon.expiresAt).toLocaleDateString('pt-BR')
    })

    await createNotification(
        user.id,
        '🎂 Feliz Aniversário!',
        `Você ganhou um cupom de ${coupon.discountValue}% de desconto!`,
        'SUCCESS'
    )
}

// ============================================
// 4. NOVO CUPOM DE DESCONTO
// ============================================
export async function notifyNewCoupon(coupon: any, clienteEspecifico?: any) {

    const clients = clienteEspecifico
        ? [clienteEspecifico]
        : await prisma.user.findMany({ where: { role: 'CLIENT' } })

    console.log(`📢 Enviando cupom para ${clients.length} cliente(s)...`)

    for (const client of clients) {
        if (client.phone) {
            const whatsappMessage = `
🎁 *NOVO CUPOM DE DESCONTO!*

Oi ${client.name}! 😊

Temos uma promoção especial para você:

*${coupon.description}*

🎫 Cupom: *${coupon.code}*
💰 Desconto: *${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : ' reais'}*
📅 Válido até: ${new Date(coupon.validUntil).toLocaleDateString('pt-BR')}

✨ Aproveite e agende já!
${SITE_URL}

Henrique Bilro Cabeleireiros 💅
            `.trim()

            await sendWhatsApp(client.phone, whatsappMessage)
        }

        await createNotification(
            client.id,
            '🎁 Novo Cupom Disponível!',
            `${coupon.code} - ${coupon.discountValue}% de desconto`,
            'INFO'
        )

        if (!clienteEspecifico) {
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
}

// ============================================
// 5. NOVO COMBO PROMOCIONAL
// ============================================
export async function notifyNewCombo(combo: any, clienteEspecifico?: any) {

    const clients = clienteEspecifico
        ? [clienteEspecifico]
        : await prisma.user.findMany({ where: { role: 'CLIENT' } })

    console.log(`📢 Enviando combo para ${clients.length} cliente(s)...`)

    for (const client of clients) {
        if (client.phone) {
            const whatsappMessage = `
🎁✨ *NOVO COMBO PROMOCIONAL!*

Oi ${client.name}! 

Acabou de sair do forno:

*${combo.name}*
${combo.description}

💰 De R$ ${combo.originalPrice.toFixed(2)} por R$ ${combo.comboPrice.toFixed(2)}
🔥 Economia de ${combo.discountPercent}%!

Serviços inclusos:
${combo.services.map((s: any) => `✓ ${s.name}`).join('\n')}

Corre que é por tempo limitado! ⏰

Agende: ${SITE_URL}

Henrique Bilro Cabeleireiros 💅✨
            `.trim()

            await sendWhatsApp(client.phone, whatsappMessage)
        }

        await createNotification(
            client.id,
            '🎁 Novo Combo Disponível!',
            `${combo.name} - ${combo.discountPercent}% OFF`,
            'INFO'
        )

        if (!clienteEspecifico) {
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
}