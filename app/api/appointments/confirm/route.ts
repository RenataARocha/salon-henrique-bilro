// app/api/appointments/confirm/route.ts
// API para confirmar agendamento via email/WhatsApp

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const appointmentId = searchParams.get('id')
        const token = searchParams.get('token')

        if (!appointmentId) {
            return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro - Henrique Bilro</title>
</head>
<body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
        <h1 style="color: #333; margin: 0 0 20px 0;">Link Inválido</h1>
        <p style="color: #666; font-size: 16px;">
            Não foi possível encontrar o agendamento.
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'}" style="display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Voltar ao Site
        </a>
    </div>
</body>
</html>
            `, {
                status: 400,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        // Buscar agendamento
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                user: true,
                service: true,
                combo: true
            }
        })

        if (!appointment) {
            return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agendamento Não Encontrado</title>
</head>
<body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
        <h1 style="color: #333; margin: 0 0 20px 0;">Agendamento Não Encontrado</h1>
        <p style="color: #666; font-size: 16px;">
            Este agendamento não existe ou já foi cancelado.
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'}" style="display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Voltar ao Site
        </a>
    </div>
</body>
</html>
            `, {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        // Se já está confirmado
        if (appointment.status === 'CONFIRMED') {
            return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Já Confirmado - Henrique Bilro</title>
</head>
<body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
        <h1 style="color: #28a745; margin: 0 0 20px 0;">Já Confirmado!</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 10px;">
            Seu agendamento já foi confirmado anteriormente.
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>Cliente:</strong> ${appointment.user.name}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Serviço:</strong> ${appointment.service?.name || appointment.combo?.name || 'N/A'}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Data:</strong> ${new Date(appointment.date).toLocaleDateString('pt-BR')}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Horário:</strong> ${appointment.time}</p>
        </div>
        <p style="color: #666; font-size: 16px;">
            Te esperamos lá! 😊
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'}" style="display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Voltar ao Site
        </a>
    </div>
</body>
</html>
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        // Confirmar agendamento
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CONFIRMED' }
        })

        console.log('✅ Agendamento confirmado:', appointmentId)

        // Página de sucesso
        return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmado! - Henrique Bilro</title>
</head>
<body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); animation: slideIn 0.5s ease-out;">
        <div style="font-size: 80px; margin-bottom: 20px; animation: bounce 1s infinite;">🎉</div>
        <h1 style="color: #28a745; margin: 0 0 20px 0; font-size: 32px;">Agendamento Confirmado!</h1>
        
        <p style="color: #666; font-size: 18px; margin-bottom: 30px;">
            Obrigado por confirmar, <strong>${appointment.user.name}</strong>!
        </p>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <p style="margin: 8px 0; color: #333; font-size: 16px;"><strong>📅 Data:</strong> ${new Date(appointment.date).toLocaleDateString('pt-BR')}</p>
            <p style="margin: 8px 0; color: #333; font-size: 16px;"><strong>⏰ Horário:</strong> ${appointment.time}</p>
            <p style="margin: 8px 0; color: #333; font-size: 16px;"><strong>💅 Serviço:</strong> ${appointment.service?.name || appointment.combo?.name || 'N/A'}</p>
            ${appointment.finalPrice ? `<p style="margin: 8px 0; color: #333; font-size: 16px;"><strong>💰 Valor:</strong> R$ ${appointment.finalPrice.toFixed(2)}</p>` : ''}
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Lembre-se:</strong> Chegar 5 minutos antes!
            </p>
        </div>
        
        <p style="color: #666; font-size: 16px; margin-top: 30px;">
            Nos vemos lá! ✨
        </p>
        
        <a href="${process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'}" style="display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
            Voltar ao Site
        </a>
    </div>
    
    <style>
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }
    </style>
</body>
</html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })

    } catch (error) {
        console.error('❌ Erro ao confirmar agendamento:', error)

        return new Response(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erro - Henrique Bilro</title>
</head>
<body style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div style="background: white; border-radius: 20px; padding: 40px; max-width: 500px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
        <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
        <h1 style="color: #dc3545; margin: 0 0 20px 0;">Erro ao Confirmar</h1>
        <p style="color: #666; font-size: 16px;">
            Ocorreu um erro ao processar sua confirmação. Por favor, tente novamente mais tarde.
        </p>
        <a href="${process.env.NEXTAUTH_URL || 'https://salon-henrique-bilro.vercel.app'}" style="display: inline-block; margin-top: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Voltar ao Site
        </a>
    </div>
</body>
</html>
        `, {
            status: 500,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
    }
}