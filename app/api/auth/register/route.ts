// app/api/auth/register/route.ts 

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, password, phone, birthDate } = body

        console.log('📝 Tentando registrar:', { email, name }) // Log para debug

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
            where: { email: email.toLowerCase().trim() }
        })

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Este email já está cadastrado' },
                { status: 400 }
            )
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10)

        // Preparar data de nascimento (se fornecida)
        let birthDateFormatted = null
        if (birthDate) {
            try {
                // Garantir que a data está no formato correto
                const dateObj = new Date(birthDate)
                // Adicionar timezone offset para evitar problemas
                dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset())
                birthDateFormatted = dateObj
            } catch (error) {
                console.error('Erro ao processar data de nascimento:', error)
                // Continuar sem a data ao invés de falhar
            }
        }

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                phone: phone ? phone.trim() : null,
                birthDate: birthDateFormatted,
                role: 'CLIENT'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })

        console.log('✅ Usuário criado:', user.email)

        return NextResponse.json({
            success: true,
            data: user,
            message: 'Cadastro realizado com sucesso!'
        })

    } catch (error: any) {
        console.error('❌ Erro no registro:', error)
        console.error('Stack:', error.stack)

        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao criar conta. Tente novamente.',
                // Em desenvolvimento, mostrar mais detalhes
                ...(process.env.NODE_ENV === 'development' && {
                    details: error.message
                })
            },
            { status: 500 }
        )
    }
}