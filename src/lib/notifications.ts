// lib/notifications.ts
// Sistema completo de notificações: WhatsApp + Email + Sistema

import { sendEmail } from './email'
import { prisma } from './prisma'

// ============================================
// CONFIGURAÇÃO DO WPPCONNECT
// ============================================
const WPPCONNECT_API_URL = process.env.WPPCONNECT_API_URL || 'http://localhost:21465'
const WPPCONNECT_SECRET = process.env.WPPCONNECT_SECRET_KEY || 'your-secret-key'
const WPPCONNECT_SESSION = 'salon-bilro'

// ============================================
// FUNÇÃO PARA ENVIAR WHATSAPP
// ============================================
async function sendWhatsApp(phone: string, message: string) {
    try {
        const formattedPhone = phone.replace(/\D/g, '') + '@c.us'

        const response = await fetch(`${WPPCONNECT_API_URL}/api/${WPPCONNECT_SESSION}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WPPCONNECT_SECRET}`
            },
            body: JSON.stringify({
                phone: formattedPhone,
                message: message,
                isGroup: false
            })
        })

        if (!response.ok) {
            throw new Error('Erro ao enviar WhatsApp')
        }

        return { success: true }
    } catch (error) {
        console.error('❌ Erro ao enviar WhatsApp:', error)
        return { success: false, error }
    }
}

// ============================================
// FUNÇÃO PARA CRIAR NOTIFICAÇÃO NO SISTEMA
// ============================================
async function createNotification(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') {
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
    await sendEmail({
        to: user.email,
        subject: 'Agendamento Confirmado - Henrique Bilro',
        template: 'appointment-confirmation',
        data: { user, service, date: dateFormatted, time }
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

    // 📧 EMAIL (já existe)
    // Mantém o email atual de aniversário

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
        // 📱 WHATSAPP
        const whatsappMessage = `
🎁 *NOVO CUPOM DE DESCONTO!*

Oi ${client.name}! 😊

Temos uma promoção especial para você:

*${coupon.description}*

🎫 Cupom: *${coupon.code}*
💰 Desconto: *${coupon.discountValue}${coupon.discountType === 'PERCENTAGE' ? '%' : ' reais'}*
📅 Válido até: ${new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}

✨ Aproveite e agende já!
https://salon-henrique-bilro.vercel.app

Henrique Bilro Cabeleireiros 💅
    `.trim()

        await sendWhatsApp(client.phone, whatsappMessage)

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
        // 📱 WHATSAPP
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

// ============================================
// 6. WEBHOOK - CLIENTE CONFIRMA NO WHATSAPP
// ============================================
export async function handleWhatsAppWebhook(data: any) {
    const { from, body } = data

    // Remover formatação do número
    const phone = from.replace('@c.us', '')

    // Buscar usuário pelo telefone
    const user = await prisma.user.findFirst({
        where: {
            phone: {
                contains: phone.slice(-9) // Últimos 9 dígitos
            }
        }
    })

    if (!user) return

    // Verificar se é confirmação
    const isConfirmation = /confirmar|confirm|sim|ok/i.test(body.toLowerCase())

    if (isConfirmation) {
        // Buscar agendamento pendente do usuário
        const appointment = await prisma.appointment.findFirst({
            where: {
                userId: user.id,
                status: { in: ['PENDING', 'CONFIRMED'] },
                date: { gte: new Date() }
            },
            orderBy: { date: 'asc' }
        })

        if (appointment) {
            // ATUALIZAR STATUS PARA CONFIRMED
            await prisma.appointment.update({
                where: { id: appointment.id },
                data: { status: 'CONFIRMED' }
            })

            // Enviar confirmação
            await sendWhatsApp(phone, `
✅ *Agendamento Confirmado!*

Obrigado pela confirmação, ${user.name}!

Seu agendamento está confirmado. Te esperamos! 😊
      `.trim())

            // 🔔 NOTIFICAÇÃO PARA ADMIN
            const admin = await prisma.user.findFirst({
                where: { role: 'ADMIN' }
            })

            if (admin) {
                await createNotification(
                    admin.id,
                    '✅ Cliente Confirmou Agendamento',
                    `${user.name} confirmou presença via WhatsApp`,
                    'SUCCESS'
                )
            }
        }
    }
}