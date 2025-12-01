// src/lib/email-templates.ts

export const passwordResetEmailTemplate = (name: string, resetUrl: string) => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - Henrique Bilro Cabeleireiros</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #2C2C2C 0%, #3D3D3D 100%); border-radius: 8px 8px 0 0;">
                            <div style="background-color: #C9A65C; width: 60px; height: 60px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <span style="color: white; font-size: 28px; font-weight: bold;">HB</span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                Henrique Bilro Cabeleireiros
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="color: #2C2C2C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">
                                Olá, ${name}! 👋
                            </h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                                Recebemos uma solicitação para redefinir a senha da sua conta.
                            </p>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                                Clique no botão abaixo para criar uma nova senha:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(to right, #C9A65C, #A68B4E);">
                                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                            Redefinir Minha Senha
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #C9A65C; border-radius: 4px;">
                                <strong>⏰ Este link expira em 1 hora.</strong><br>
                                Se você não solicitou esta alteração, pode ignorar este email com segurança.
                            </p>
                            
                            <p style="color: #999999; font-size: 13px; line-height: 20px; margin: 20px 0 0 0;">
                                Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                                <a href="${resetUrl}" style="color: #C9A65C; word-break: break-all;">${resetUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="color: #999999; font-size: 13px; line-height: 20px; margin: 0 0 10px 0;">
                                <strong>Henrique Bilro Cabeleireiros</strong><br>
                                Rua Exemplo, 123 - Centro<br>
                                São Gonçalo do Amarante/RN<br>
                                (84) 99999-9999
                            </p>
                            
                            <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                                © ${new Date().getFullYear()} Henrique Bilro Cabeleireiros. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim()
}

// Template de texto puro (fallback)
export const passwordResetTextTemplate = (name: string, resetUrl: string) => {
    return `
Olá, ${name}!

Recebemos uma solicitação para redefinir a senha da sua conta no Henrique Bilro Cabeleireiros.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

⏰ Este link expira em 1 hora.

Se você não solicitou esta alteração, pode ignorar este email com segurança.

---
Henrique Bilro Cabeleireiros
Rua Exemplo, 123 - Centro
São Gonçalo do Amarante/RN
(84) 99999-9999

© ${new Date().getFullYear()} Henrique Bilro Cabeleireiros. Todos os direitos reservados.
    `.trim()
}