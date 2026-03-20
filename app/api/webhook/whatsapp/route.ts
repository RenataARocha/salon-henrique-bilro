// app/api/webhook/whatsapp/route.ts
// Menu de atendimento direto — sem dependência do Typebot

import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'

// Sessões ativas: guarda em qual etapa do menu o cliente está
const sessions = new Map<string, { step: string }>()

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

        // Ignora mensagens enviadas pelo próprio bot
        if (body.data?.key?.fromMe) {
            return NextResponse.json({ ok: true })
        }

        // Ignora se não for mensagem de texto
        const messageType = body.data?.messageType
        if (!['conversation', 'extendedTextMessage'].includes(messageType)) {
            return NextResponse.json({ ok: true })
        }

        const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
        const messageText = (
            body.data?.message?.conversation ||
            body.data?.message?.extendedTextMessage?.text ||
            ''
        ).trim().toLowerCase()

        if (!phone || !messageText) {
            return NextResponse.json({ ok: true })
        }

        console.log(`📱 Mensagem de ${phone}: ${messageText}`)

        // Comando "menu" volta para o início
        if (messageText === 'menu') {
            await sendMessage(phone, `Olá! 💛 Seja bem-vinda ao *Henrique Bilro Cabeleireiros*!\n\nComo posso te ajudar hoje?\n\n${MENU}`)
            sessions.set(phone, { step: 'menu' })
            return NextResponse.json({ ok: true })
        }

        const session = sessions.get(phone)

        // Primeira mensagem ou sessão expirada → envia boas-vindas + menu
        if (!session) {
            await sendMessage(phone, `Olá! 💛 Seja bem-vinda ao *Henrique Bilro Cabeleireiros*!\n\nSou o assistente virtual do salão. Como posso te ajudar hoje?\n\n${MENU}`)
            sessions.set(phone, { step: 'menu' })
            return NextResponse.json({ ok: true })
        }

        // Cliente escolheu uma opção do menu
        if (RESPOSTAS[messageText]) {
            await sendMessage(phone, RESPOSTAS[messageText])

            // Opção 4 (falar com equipe) encerra o bot
            if (messageText === '4') {
                sessions.delete(phone)
            }

            return NextResponse.json({ ok: true })
        }

        // Resposta não reconhecida → reenviar o menu
        await sendMessage(phone, `Não entendi 😊 Por favor, escolha uma das opções:\n\n${MENU}`)

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('❌ Erro no webhook:', error)
        return NextResponse.json({ ok: true })
    }
}

async function sendMessage(phone: string, text: string) {
    try {
        const res = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({ number: phone, text })
            }
        )
        if (!res.ok) {
            console.error('❌ Erro ao enviar mensagem:', await res.text())
        }
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
    }
}

// GET para verificar se o webhook está ativo
export async function GET() {
    return NextResponse.json({ status: 'Webhook ativo ✅' })
}