// app/api/admin/credentials/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { currentPassword, newEmail, newPassword } = await request.json()

        // Ler credenciais atuais do arquivo
        const credentialsPath = join(process.cwd(), 'admin-credentials.json')
        let currentCreds = { email: '', password: '' }

        try {
            const data = readFileSync(credentialsPath, 'utf8')
            currentCreds = JSON.parse(data)
        } catch (error) {
            // Se não existir, usar padrão
            currentCreds = {
                email: 'admin@henriquebilro.com',
                password: await bcrypt.hash('admin123', 10)
            }
        }

        // Verificar senha atual
        const isValid = await bcrypt.compare(currentPassword, currentCreds.password)

        if (!isValid) {
            return NextResponse.json(
                { success: false, error: 'Senha atual incorreta' },
                { status: 401 }
            )
        }

        // Atualizar credenciais
        const newCreds = {
            email: newEmail || currentCreds.email,
            password: newPassword ? await bcrypt.hash(newPassword, 10) : currentCreds.password
        }

        // Salvar no arquivo
        writeFileSync(credentialsPath, JSON.stringify(newCreds, null, 2))

        return NextResponse.json({
            success: true,
            message: 'Credenciais atualizadas com sucesso'
        })

    } catch (error) {
        console.error('Erro ao atualizar credenciais:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar credenciais' },
            { status: 500 }
        )
    }
}