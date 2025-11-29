// app/api/auth/register/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, password, phone } = body

        // Validações
        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'A senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Este email já está cadastrado' },
                { status: 400 }
            )
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                role: 'CLIENT'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })

        return NextResponse.json({
            success: true,
            data: user,
            message: 'Cadastro realizado com sucesso!'
        })

    } catch (error) {
        console.error('Erro no registro:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar conta. Tente novamente.' },
            { status: 500 }
        )
    }
}