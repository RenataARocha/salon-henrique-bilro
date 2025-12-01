// app/api/auth/reset-password/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { token, password } = body

        // Validações
        if (!token || !password) {
            return NextResponse.json(
                { success: false, error: 'Token e senha são obrigatórios' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'A senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            )
        }

        // Buscar token
        const resetToken = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: true }
        })

        if (!resetToken) {
            return NextResponse.json(
                { success: false, error: 'Token inválido ou expirado' },
                { status: 400 }
            )
        }

        // Verificar se já foi usado
        if (resetToken.used) {
            return NextResponse.json(
                { success: false, error: 'Este link já foi utilizado' },
                { status: 400 }
            )
        }

        // Verificar se expirou
        if (new Date() > resetToken.expiresAt) {
            return NextResponse.json(
                { success: false, error: 'Este link expirou. Solicite um novo link de recuperação.' },
                { status: 400 }
            )
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Atualizar senha do usuário
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword }
        })

        // Marcar token como usado
        await prisma.passwordReset.update({
            where: { id: resetToken.id },
            data: { used: true }
        })

        return NextResponse.json({
            success: true,
            message: 'Senha redefinida com sucesso! Faça login com sua nova senha.'
        })

    } catch (error) {
        console.error('Erro ao redefinir senha:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao redefinir senha' },
            { status: 500 }
        )
    }
}

// GET - Validar token (verificar se é válido antes de mostrar formulário)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Token não fornecido' },
                { status: 400 }
            )
        }

        const resetToken = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: { select: { email: true, name: true } } }
        })

        if (!resetToken) {
            return NextResponse.json(
                { success: false, error: 'Token inválido' },
                { status: 400 }
            )
        }

        if (resetToken.used) {
            return NextResponse.json(
                { success: false, error: 'Token já utilizado' },
                { status: 400 }
            )
        }

        if (new Date() > resetToken.expiresAt) {
            return NextResponse.json(
                { success: false, error: 'Token expirado' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                email: resetToken.user.email,
                name: resetToken.user.name
            }
        })

    } catch (error) {
        console.error('Erro ao validar token:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao validar token' },
            { status: 500 }
        )
    }
}