// app/api/webhook/whatsapp/route.ts

import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'

const PAUSA_MINUTOS = 30 // Bot pausa por 30 min após Rosie responder manualmente

// Sessões ativas por número
const sessions = new Map<string, { step: string }>()
// Números com bot pausado (Rosie assumiu o atendimento)
const pausados = new Map<string, number>() // phone → timestamp de quando pausar até

const MENU = `1️⃣ Agendamento
2️⃣ Serviços e preços
3️⃣ Localização e horários
4️⃣ Falar com a equipe

_Digite o número da opção desejada_`

const RESPOSTAS: Record<string, string> = {
    '1': `Para agendar, reagendar ou cancelar seu horário, acesse nosso site — é rápido e fácil! 😊\n\n👉 https://salon-henrique-bilro.vercel.app/agendar\n\nDigite *menu* para voltar ao início.`,
    '2': `Confira todos os nossos serviços e valores acessando o site:\n\n👉 https://salon-henrique-bilro.vercel.app/#servicos\n\nQualquer dúvida, estamos aqui! 💛\n\nDigite *menu* para voltar ao início.`,
    '3': `📍 *Endereço:* Av. Rio Doce, 3101 – Potengi, Natal/RN\n\n🕐 *Horário de Funcionamento:*\nTerça a Sábado: 9h às 19h\nDomingo e Segunda: Fechado\n\n🗺️ Como chegar:\nhttps://www.google.com/maps/place/Henrique+Bilro+Cabeleireiros/@-5.7407769,-35.256693,17z/data=!4m6!3m5!1s0x7b3aa3210598e31:0x91e7dcbd464dbf67!8m2!3d-5.7407769!4d-35.2541181!16s%2Fg%2F11gf8fk3hn?entry=ttu&g_ep=EgoyMDI2MDMxNy4wIKXMDSoASAFQAw%3D%3D\n\nDigite *menu* para voltar ao início.`,
    '4': `Certo! 💛 Nossa equipe vai entrar em contato com você em breve.\n\nCaso seja urgente, você também pode nos chamar diretamente neste número. 😊`,
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const fromMe = body.data?.key?.fromMe
        const messageType = body.data?.messageType

        // ── Mensagem ENVIADA pela Rosie (fromMe = true) ──────────────────────
        // Pausa o bot para aquele contato por PAUSA_MINUTOS minutos
        if (fromMe) {
            const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
            if (phone) {
                const pausaAte = Date.now() + PAUSA_MINUTOS * 60 * 1000
                pausados.set(phone, pausaAte)
                sessions.delete(phone) // limpa sessão do bot
                console.log(`⏸️ Bot pausado para ${phone} por ${PAUSA_MINUTOS} min`)
            }
            return NextResponse.json({ ok: true })
        }

        // Ignora tipos que não são texto
        if (!['conversation', 'extendedTextMessage'].includes(messageType)) {
            return NextResponse.json({ ok: true })
        }

        const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
        const messageText = (
            body.data?.message?.conversation ||
            body.data?.message?.extendedTextMessage?.text ||
            ''
        ).trim().toLowerCase()

        if (!phone || !messageText) return NextResponse.json({ ok: true })

        // ── Verifica se bot está pausado para este número ────────────────────
        const pausaAte = pausados.get(phone)
        if (pausaAte && Date.now() < pausaAte) {
            const minutosRestantes = Math.ceil((pausaAte - Date.now()) / 60000)
            console.log(`⏸️ Bot pausado para ${phone} — ${minutosRestantes} min restantes`)
            return NextResponse.json({ ok: true })
        } else if (pausaAte) {
            // Pausa expirou — remove e retoma
            pausados.delete(phone)
            console.log(`▶️ Bot retomado para ${phone}`)
        }

        console.log(`📱 Mensagem de ${phone}: ${messageText}`)

        // Comando "menu" volta ao início
        if (messageText === 'menu') {
            await sendMessage(phone, `Olá! 💛 Seja bem-vinda ao *Henrique Bilro Cabeleireiros*!\n\nComo posso te ajudar hoje?\n\n${MENU}`)
            sessions.set(phone, { step: 'menu' })
            return NextResponse.json({ ok: true })
        }

        const session = sessions.get(phone)

        // Primeira mensagem → boas-vindas + menu
        if (!session) {
            await sendMessage(phone, `Olá! 💛 Seja bem-vinda ao *Henrique Bilro Cabeleireiros*!\n\nSou o assistente virtual do salão. Como posso te ajudar hoje?\n\n${MENU}`)
            sessions.set(phone, { step: 'menu' })
            return NextResponse.json({ ok: true })
        }

        // Opção escolhida
        if (RESPOSTAS[messageText]) {
            await sendMessage(phone, RESPOSTAS[messageText])
            if (messageText === '4') sessions.delete(phone)
            return NextResponse.json({ ok: true })
        }

        // Resposta não reconhecida
        await sendMessage(phone, `Não entendi 😊 Por favor, escolha uma das opções:\n\n${MENU}`)
        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('❌ Erro no webhook:', error)
        return NextResponse.json({ ok: true })
    }
}

async function sendMessage(phone: string, text: string) {
    try {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text })
        })
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Webhook ativo ✅' })
}