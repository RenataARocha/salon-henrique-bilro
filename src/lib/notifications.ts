// src/lib/notifications.ts
// Sistema completo de notificações: WhatsApp + Email + Sistema

import {
    sendAppointmentConfirmationEmail,
    sendAppointmentReminderEmail,
    sendBirthdayEmail
} from './email/notificationEmails'
import { prisma } from './prisma'

// ============================================
// CONFIGURAÇÃO DO WPPCONNECT
// ============================================
const WPPCONNECT_API_URL = process.env.WPPCONNECT_API_URL || 'http://localhost:21465'

// ============================================
// FUNÇÃO PARA ENVIAR WHATSAPP
// ============================================
async function sendWhatsApp(phone: string, message: string) {
    try {
        const numero = phone.replace(/\D/g, '')

        const response = await fetch(`${WPPCONNECT_API_URL}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: numero,
                message: message
            })
        })

        if (!response.ok) {
            console.error('❌ Erro ao enviar WhatsApp:', response.statusText)
            return { success: false }
        }

        const data = await response.json()

        if (data.success) {
            console.log('✅ WhatsApp enviado com sucesso')
            return { success: true }
        } else {
            console.error('❌ Erro na resposta:', data.error)
            return { success: false }
        }
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
    const { user, service, date, time } = appointment

    const dateFormatted = new Date(date).toLocaleDateString('pt-BR')

    // 📱 WHATSAPP
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
- Chegar 5 minutos antes
- Cancelamento até 2h antes

Para confirmar, responda com *"CONFIRMAR"*

Nos vemos lá! 😊
  `.trim()

    await sendWhatsApp(user.phone, whatsappMessage)

    // 📧 EMAIL
    await sendAppointmentConfirmationEmail({
        to: user.email,
        name: user.name,
        service: service.name,
        date: dateFormatted,
        time: time,
        price: service.price
    })

    // 🔔 NOTIFICAÇÃO NO SISTEMA
    await createNotification(
        user.id,
        'Agendamento Criado',
        `Seu agendamento para ${service.name} foi confirmado para ${dateFormatted} às ${time}`,
        'SUCCESS'
    )
}

// ============================================
// 2. LEMBRETE 2 DIAS ANTES
// ============================================
export async function notifyAppointmentReminder(appointment: any) {
    const { user, service, date, time } = appointment
    const dateFormatted = new Date(date).toLocaleDateString('pt-BR')

    // 📱 WHATSAPP
    const whatsappMessage = `
⏰ *Lembrete de Agendamento*

Oi ${user.name}! 👋

Lembrando que você tem agendamento amanhã:

📅 ${dateFormatted} às ${time}
💅 ${service.name}

📍 Av. Rio Doce, 3101 – Potengi

Confirme sua presença respondendo *"CONFIRMAR"*

Caso precise reagendar ou cancelar, entre em contato o quanto antes! 📞

Te esperamos! ✨
  `.trim()

    await sendWhatsApp(user.phone, whatsappMessage)

    // 📧 EMAIL
    await sendAppointmentReminderEmail({
        to: user.email,
        name: user.name,
        service: service.name,
        date: dateFormatted,
        time: time
    })

    // 🔔 NOTIFICAÇÃO
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
    // Verificar se tem telefone antes de enviar WhatsApp
    if (user.phone) {
        // 📱 WHATSAPP
        const whatsappMessage = `
🎂🎉 *FELIZ ANIVERSÁRIO, ${user.name.toUpperCase()}!* 🎉🎂

A equipe Henrique Bilro deseja um dia incrível! 💖

🎁 *PRESENTE ESPECIAL:*

Cupom: *${coupon.code}*
Desconto: *${coupon.discountValue}%*
Válido até: ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}

✨ Use no seu próximo agendamento e aproveite!

Agende pelo site: https://salon-henrique-bilro.vercel.app

Com carinho,
Equipe Henrique Bilro 💕
  `.trim()

        await sendWhatsApp(user.phone, whatsappMessage)
    }

    // 📧 EMAIL
    await sendBirthdayEmail({
        to: user.email,
        name: user.name,
        couponCode: coupon.code,
        discountValue: coupon.discountValue,
        expiresAt: new Date(coupon.expiresAt).toLocaleDateString('pt-BR')
    })

    // 🔔 NOTIFICAÇÃO
    await createNotification(
        user.id,
        '🎂 Feliz Aniversário!',
        `Você ganhou um cupom de ${coupon.discountValue}% de desconto!`,
        'SUCCESS'
    )
}

// ============================================
// 4. NOVO CUPOM DE DESCONTO (PARA TODAS)
// ============================================
export async function notifyNewCoupon(coupon: any) {
    // Buscar TODAS as clientes ativas
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' }
    })

    console.log(`📢 Enviando cupom para ${clients.length} clientes...`)

    for (const client of clients) {
        // 📱 WHATSAPP (se tiver telefone)
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
https://salon-henrique-bilro.vercel.app

Henrique Bilro Cabeleireiros 💅
    `.trim()

            await sendWhatsApp(client.phone, whatsappMessage)
        }

        // 📧 EMAIL (se tiver)
        if (client.email) {
            try {
                console.log(`✅ Email enviado para ${client.email}`)
            } catch (error) {
                console.error(`❌ Erro ao enviar email para ${client.email}:`, error)
            }
        }

        // 🔔 NOTIFICAÇÃO
        await createNotification(
            client.id,
            '🎁 Novo Cupom Disponível!',
            `${coupon.code} - ${coupon.discountValue}% de desconto`,
            'INFO'
        )

        // Delay para não ser spam
        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}

// ============================================
// 5. NOVO COMBO PROMOCIONAL
// ============================================
export async function notifyNewCombo(combo: any) {
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' }
    })

    console.log(`📢 Enviando combo para ${clients.length} clientes...`)

    for (const client of clients) {
        // 📱 WHATSAPP (se tiver telefone)
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

Agende: https://salon-henrique-bilro.vercel.app

Henrique Bilro Cabeleireiros 💅✨
    `.trim()

            await sendWhatsApp(client.phone, whatsappMessage)
        }

        // 🔔 NOTIFICAÇÃO
        await createNotification(
            client.id,
            '🎁 Novo Combo Disponível!',
            `${combo.name} - ${combo.discountPercent}% OFF`,
            'INFO'
        )

        await new Promise(resolve => setTimeout(resolve, 2000))
    }
}