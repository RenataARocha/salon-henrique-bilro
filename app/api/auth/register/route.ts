// app/api/auth/register/route.ts 

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    console.log('🚀 [REGISTER] Iniciando registro...')

    try {
        // Parse do body
        let body
        try {
            body = await request.json()
            console.log('📦 [REGISTER] Body recebido:', {
                email: body.email,
                name: body.name,
                hasPassword: !!body.password,
                hasPhone: !!body.phone,
                hasBirthDate: !!body.birthDate
            })
        } catch (error) {
            console.error('❌ [REGISTER] Erro ao fazer parse do body:', error)
            return NextResponse.json(
                { success: false, error: 'Dados inválidos' },
                { status: 400 }
            )
        }

        const { name, email, password, phone, birthDate } = body

        // Validações
        if (!name || !email || !password) {
            console.log('⚠️ [REGISTER] Campos obrigatórios faltando')
            return NextResponse.json(
                { success: false, error: 'Preencha todos os campos obrigatórios' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            console.log('⚠️ [REGISTER] Senha muito curta')
            return NextResponse.json(
                { success: false, error: 'A senha deve ter no mínimo 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar se email já existe
        console.log('🔍 [REGISTER] Verificando se email existe:', email)
        try {
            const existingUser = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() }
            })

            if (existingUser) {
                console.log('⚠️ [REGISTER] Email já cadastrado:', email)
                return NextResponse.json(
                    { success: false, error: 'Este email já está cadastrado' },
                    { status: 400 }
                )
            }
        } catch (error) {
            console.error('❌ [REGISTER] Erro ao verificar email:', error)
            throw error
        }

        // Hash da senha
        console.log('🔐 [REGISTER] Gerando hash da senha...')
        let hashedPassword
        try {
            hashedPassword = await bcrypt.hash(password, 10)
            console.log('✅ [REGISTER] Hash gerado com sucesso')
        } catch (error) {
            console.error('❌ [REGISTER] Erro ao gerar hash:', error)
            throw error
        }

        // Preparar data de nascimento
        let birthDateFormatted = null
        if (birthDate) {
            console.log('📅 [REGISTER] Processando data de nascimento:', birthDate)
            try {
                const dateObj = new Date(birthDate + 'T00:00:00.000Z')
                birthDateFormatted = dateObj
                console.log('✅ [REGISTER] Data formatada:', birthDateFormatted.toISOString())
            } catch (error) {
                console.error('⚠️ [REGISTER] Erro ao processar data, continuando sem ela:', error)
            }
        }

        // Criar usuário
        console.log('💾 [REGISTER] Criando usuário no banco...')
        let user
        try {
            user = await prisma.user.create({
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
            console.log('✅ [REGISTER] Usuário criado com sucesso:', user.email)
        } catch (error: any) {
            console.error('❌ [REGISTER] Erro ao criar usuário no Prisma:', error)
            console.error('Código do erro:', error.code)
            console.error('Mensagem:', error.message)
            throw error
        }

        return NextResponse.json({
            success: true,
            data: user,
            message: 'Cadastro realizado com sucesso!'
        })

    } catch (error: any) {
        console.error('❌ [REGISTER] ERRO FATAL:', error)
        console.error('Nome do erro:', error.name)
        console.error('Mensagem:', error.message)
        console.error('Stack:', error.stack)

        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao criar conta. Tente novamente.',
                details: error.message // Mostrar detalhes para debug
            },
            { status: 500 }
        )
    }
}