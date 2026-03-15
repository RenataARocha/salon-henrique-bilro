// app/api/appointments/confirm/route.ts
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const SITE_URL = process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'

const goldStyles = `
  body { font-family: 'Georgia', serif; background: #0a0a0a; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #111; border: 1px solid #c9a84c; border-radius: 20px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 0 40px rgba(201,168,76,0.2); animation: slideIn 0.5s ease-out; }
  h1 { color: #c9a84c; margin: 0 0 20px 0; }
  p { color: #ccc; font-size: 16px; }
  .info-box { background: #1a1a1a; border: 1px solid #c9a84c33; padding: 25px; border-radius: 12px; margin: 25px 0; }
  .info-box p { color: #ddd; margin: 8px 0; font-size: 16px; }
  .info-box strong { color: #c9a84c; }
  .aviso { background: #1a1500; border: 1px solid #c9a84c55; padding: 15px; border-radius: 8px; margin: 20px 0; color: #c9a84c !important; font-size: 14px !important; }
  .btn { display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #c9a84c 0%, #f0d080 100%); color: #000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(201,168,76,0.4); }
  .emoji { font-size: 72px; margin-bottom: 20px; animation: bounce 2s infinite; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
`

function html(content: string) {
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Henrique Bilro Cabeleireiros</title>
    <style>${goldStyles}</style>
</head>
<body>
    <div class="card">${content}</div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
    include: {
        user: true
        service: true
        combo: true
        appointmentServices: {
            include: { service: true }
        }
    }
}>

function getServiceName(appointment: AppointmentWithRelations): string {
    if (appointment.appointmentServices?.length > 0) {
        return appointment.appointmentServices
            .map(as => as.service.name)
            .join(' + ')
    }
    return appointment.service?.name || appointment.combo?.name || 'Serviço'
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const appointmentId = searchParams.get('id')

        if (!appointmentId) {
            return html(`
                <div class="emoji">❌</div>
                <h1>Link Inválido</h1>
                <p>Não foi possível encontrar o agendamento.</p>
                <a href="${SITE_URL}" class="btn">Voltar ao Site</a>
            `)
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                service: true,
                combo: true,
                appointmentServices: {
                    include: { service: true }
                }
            }
        })

        if (!appointment) {
            return html(`
                <div class="emoji">🔍</div>
                <h1>Agendamento Não Encontrado</h1>
                <p>Este agendamento não existe ou já foi cancelado.</p>
                <a href="${SITE_URL}" class="btn">Voltar ao Site</a>
            `)
        }

        const serviceName = getServiceName(appointment)
        const dateFormatted = new Date(appointment.date).toLocaleDateString('pt-BR')
        const priceHtml = appointment.finalPrice
            ? `<p><strong>💰 Valor:</strong> R$ ${appointment.finalPrice.toFixed(2)}</p>`
            : ''

        if (appointment.status === 'CONFIRMED') {
            return html(`
                <div class="emoji">✅</div>
                <h1>Já Confirmado!</h1>
                <p>Seu agendamento já foi confirmado anteriormente.</p>
                <div class="info-box">
                    <p><strong>👤 Cliente:</strong> ${appointment.user.name}</p>
                    <p><strong>💅 Serviço:</strong> ${serviceName}</p>
                    <p><strong>📅 Data:</strong> ${dateFormatted}</p>
                    <p><strong>⏰ Horário:</strong> ${appointment.time}</p>
                    ${priceHtml}
                </div>
                <p>Te esperamos lá! 💕</p>
                <a href="${SITE_URL}" class="btn">Voltar ao Site</a>
            `)
        }

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CONFIRMED' }
        })

        try {
            const admin = await prisma.user.findFirst({
                where: { email: process.env.ADMIN_EMAIL }
            })

            if (admin) {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        title: '✅ Agendamento Confirmado!',
                        message: `${appointment.user.name} confirmou o agendamento de ${serviceName} para ${dateFormatted} às ${appointment.time}`,
                        type: 'SUCCESS',
                        read: false
                    }
                })
                console.log('✅ Notificação criada para admin')
            }
        } catch (notifError) {
            console.error('⚠️ Erro ao criar notificação:', notifError)
        }

        console.log('✅ Agendamento confirmado:', appointmentId)

        return html(`
            <div class="emoji">🎉</div>
            <h1>Agendamento Confirmado!</h1>
            <p>Obrigada por confirmar, <strong style="color:#c9a84c">${appointment.user.name}</strong>!</p>
            <div class="info-box">
                <p><strong>📅 Data:</strong> ${dateFormatted}</p>
                <p><strong>⏰ Horário:</strong> ${appointment.time}</p>
                <p><strong>💅 Serviço:</strong> ${serviceName}</p>
                ${priceHtml}
            </div>
            <div class="aviso">
                ⚠️ Lembre-se: chegar 10 minutos antes!
            </div>
            <p>Nos vemos lá! ✨</p>
            <a href="${SITE_URL}" class="btn">Voltar ao Site</a>
        `)

    } catch (error) {
        console.error('❌ Erro ao confirmar agendamento:', error)
        return html(`
            <div class="emoji">⚠️</div>
            <h1 style="color:#dc3545">Erro ao Confirmar</h1>
            <p>Ocorreu um erro. Por favor, tente novamente mais tarde.</p>
            <a href="${SITE_URL}" class="btn">Voltar ao Site</a>
        `)
    }
}