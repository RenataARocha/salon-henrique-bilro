// lib/email/birthday-template.tsx

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BirthdayEmailParams {
    to: string
    name: string
    couponCode: string
    discountValue: number
    discountType: string
    validUntil: Date
}

export async function sendBirthdayEmail({
    to,
    name,
    couponCode,
    discountValue,
    discountType,
    validUntil
}: BirthdayEmailParams) {
    const firstName = name.split(' ')[0]
    const discountText = discountType === 'PERCENTAGE'
        ? `${discountValue}% OFF`
        : `R$ ${discountValue.toFixed(2)} de desconto`

    const validUntilFormatted = new Date(validUntil).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            background: linear-gradient(135deg, #C9A86A 0%, #E6C88C 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .birthday-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: bounce 1s infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .greeting {
            font-size: 24px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .gift-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .gift-icon {
            font-size: 60px;
            margin-bottom: 15px;
        }
        .discount {
            font-size: 48px;
            font-weight: bold;
            margin: 15px 0;
        }
        .coupon-code {
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 20px 0;
            border: 2px dashed white;
        }
        .validity {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 15px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #C9A86A 0%, #E6C88C 100%);
            color: white;
            padding: 18px 50px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(201, 168, 106, 0.3);
            transition: transform 0.3s;
        }
        .cta-button:hover {
            transform: translateY(-3px);
        }
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .footer-logo {
            font-size: 24px;
            font-weight: bold;
            color: #C9A86A;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="birthday-icon">🎂</div>
            <h1>Feliz Aniversário!</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Parabéns, ${firstName}! 🎉
            </div>
            
            <div class="message">
                Hoje é seu dia especial e queremos comemorar com você!<br>
                Como presente, preparamos uma surpresa incrível:
            </div>
            
            <div class="gift-box">
                <div class="gift-icon">🎁</div>
                <div class="discount">${discountText}</div>
                <p style="margin: 10px 0; font-size: 18px;">
                    em qualquer serviço!
                </p>
                
                <div class="coupon-code">
                    ${couponCode}
                </div>
                
                <div class="validity">
                    ⏰ Válido até ${validUntilFormatted}
                </div>
            </div>
            
            <p class="message">
                Aproveite para se presentear com aquele serviço<br>
                que você tanto merece! 💛✨
            </p>
            
            <a href="${appUrl}/agendar" class="cta-button">
                AGENDAR AGORA
            </a>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
                Use o cupom <strong>${couponCode}</strong> no momento do agendamento
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-logo">
                Henrique Bilro Cabeleireiros
            </div>
            <p>
                Obrigada por fazer parte da nossa história! ❤️<br>
                Estamos ansiosos para te ver em breve!
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                📍 Av. Rio Doce, 3101 – Potengi, Natal / RN<br>
                📱 (84) 98881-4965<br>
                💌 salaobilro@icloud.com
            </p>
        </div>
    </div>
</body>
</html>
    `

    try {
        const { data, error } = await resend.emails.send({
            from: 'Henrique Bilro <onboarding@resend.dev>',
            to: [to],
            subject: `🎂 ${firstName}, Feliz Aniversário! Presente especial para você! 🎁`,
            html
        })

        if (error) {
            console.error('Erro ao enviar email:', error)
            throw error
        }

        return { success: true, data }
    } catch (error) {
        console.error('Erro ao enviar email de aniversário:', error)
        throw error
    }
}