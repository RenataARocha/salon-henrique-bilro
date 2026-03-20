// app/api/webhook/whatsapp/route.ts
// Recebe mensagens do WhatsApp via Evolution API
// e responde usando o Typebot como cérebro

import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'salon-bilro'
const TYPEBOT_API_URL = 'https://typebot.co/api/v1'
const TYPEBOT_PUBLIC_ID = 'henrique-bilro-atendimento-z9x2j8w'
const TYPEBOT_API_KEY = process.env.TYPEBOT_API_KEY!

// Sessões ativas por número de telefone
// Em produção considere usar Redis ou banco de dados
const sessions = new Map<string, string>()

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // Ignora mensagens enviadas pelo próprio bot
        if (body.data?.key?.fromMe) {
            return NextResponse.json({ ok: true })
        }

        // Ignora se não for mensagem de texto
        const messageType = body.data?.messageType
        if (!['conversation', 'extendedTextMessage', 'buttonsResponseMessage', 'listResponseMessage'].includes(messageType)) {
            return NextResponse.json({ ok: true })
        }

        // Extrai dados da mensagem
        const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')
        const messageText =
            body.data?.message?.conversation ||
            body.data?.message?.extendedTextMessage?.text ||
            body.data?.message?.buttonsResponseMessage?.selectedDisplayText ||
            body.data?.message?.listResponseMessage?.title ||
            ''

        if (!phone || !messageText) {
            return NextResponse.json({ ok: true })
        }

        console.log(`📱 Mensagem de ${phone}: ${messageText}`)

        // Verifica se o cliente digitou "sair" para encerrar o bot
        if (messageText.toLowerCase().trim() === 'sair') {
            sessions.delete(phone)
            await sendWhatsAppMessage(phone, 'Até logo! 💛 Se precisar de algo, é só chamar.')
            return NextResponse.json({ ok: true })
        }

        // Obtém ou cria sessão do Typebot
        const sessionId = sessions.get(phone)

        let typebotResponse

        if (!sessionId) {
            // Nova conversa — inicia sessão no Typebot
            typebotResponse = await startTypebotSession(phone, messageText)
        } else {
            // Conversa existente — continua sessão
            typebotResponse = await continueTypebotSession(sessionId, messageText)
        }

        if (!typebotResponse) {
            await sendWhatsAppMessage(phone, 'Desculpe, tive um problema. Digite qualquer mensagem para recomeçar. 😊')
            sessions.delete(phone)
            return NextResponse.json({ ok: true })
        }

        // Salva o sessionId
        if (typebotResponse.sessionId) {
            sessions.set(phone, typebotResponse.sessionId)
        }

        // Envia as mensagens de resposta do Typebot
        const messages = typebotResponse.messages || []
        const input = typebotResponse.input

        for (const message of messages) {
            if (message.type === 'text') {
                const text = message.content?.richText
                    ?.map((block: any) =>
                        block.children?.map((child: any) => child.text || '').join('') || ''
                    )
                    .join('\n') || ''

                if (text.trim()) {
                    await sendWhatsAppMessage(phone, text)
                    // Pequeno delay entre mensagens
                    await new Promise(r => setTimeout(r, 500))
                }
            }
        }

        // Se tiver botões, envia como lista
        if (input?.type === 'choice input') {
            const buttons = input.items?.map((item: any) => item.content) || []
            if (buttons.length > 0) {
                await sendWhatsAppButtons(phone, buttons)
            }
        }

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('❌ Erro no webhook:', error)
        return NextResponse.json({ ok: true }) // Sempre retorna 200 para a Evolution não reenviar
    }
}

// ── Typebot: inicia nova sessão ──────────────────────────────────────────────
async function startTypebotSession(phone: string, message: string) {
    try {
        const res = await fetch(
            `${TYPEBOT_API_URL}/typebots/${TYPEBOT_PUBLIC_ID}/startChat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TYPEBOT_API_KEY}`
                },
                body: JSON.stringify({
                    isStreamEnabled: false,
                    prefilledVariables: { phone }
                })
            }
        )

        if (!res.ok) {
            console.error('❌ Erro ao iniciar sessão Typebot:', await res.text())
            return null
        }

        return await res.json()
    } catch (error) {
        console.error('❌ Erro ao iniciar sessão Typebot:', error)
        return null
    }
}

// ── Typebot: continua sessão existente ───────────────────────────────────────
async function continueTypebotSession(sessionId: string, message: string) {
    try {
        const res = await fetch(
            `${TYPEBOT_API_URL}/typebots/${TYPEBOT_PUBLIC_ID}/continueChat`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TYPEBOT_API_KEY}`
                },
                body: JSON.stringify({
                    sessionId,
                    message
                })
            }
        )

        if (!res.ok) {
            console.error('❌ Erro ao continuar sessão Typebot:', await res.text())
            return null
        }

        return await res.json()
    } catch (error) {
        console.error('❌ Erro ao continuar sessão Typebot:', error)
        return null
    }
}

// ── Evolution API: envia mensagem de texto ───────────────────────────────────
async function sendWhatsAppMessage(phone: string, text: string) {
    try {
        await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: phone,
                    text
                })
            }
        )
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
    }
}

// ── Evolution API: envia opções como texto numerado ─────────────────────────
async function sendWhatsAppButtons(phone: string, buttons: string[]) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    const text = buttons
        .map((btn, i) => `${emojis[i] || `${i + 1}.`} ${btn}`)
        .join('\n')

    await sendWhatsAppMessage(phone, `${text}\n\n_Digite o número da opção desejada_`)
}

// GET para verificar se o webhook está ativo
export async function GET() {
    return NextResponse.json({ status: 'Webhook ativo ✅' })
}