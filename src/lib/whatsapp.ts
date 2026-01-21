// lib/whatsapp.ts - Criar este arquivo

interface WhatsAppMessage {
    to: string // Número com DDI: 5584999999999
    message: string
}

export async function sendWhatsApp({ to, message }: WhatsAppMessage) {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
    const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE

    try {
        const response = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY!
                },
                body: JSON.stringify({
                    number: to,
                    text: message
                })
            }
        )

        return await response.json()
    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error)
        throw error
    }
}

// Templates de mensagens
export const whatsappTemplates = {
    confirmacao: (nome: string, servico: string, data: string, hora: string) => `
Olá ${nome}! ✨

Seu agendamento foi confirmado:
📅 ${data}
🕐 ${hora}
💅 ${servico}

Para confirmar presença, responda com SIM
Para cancelar, acesse: ${process.env.NEXT_PUBLIC_APP_URL}/meus-agendamentos
  `.trim(),

    aniversario: (nome: string, cupom: string, desconto: number) => `
🎉 FELIZ ANIVERSÁRIO ${nome}! 🎂

Preparamos um presente especial:
🎁 ${desconto}% de desconto

Use o cupom: ${cupom}
Válido até ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}

Agende já: ${process.env.NEXT_PUBLIC_APP_URL}
  `.trim()
}