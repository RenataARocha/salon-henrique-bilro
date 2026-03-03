// app/api/staff/route.ts
// API de Funcionários (CRUD)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os funcionários
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('active') === 'true'

        const where = activeOnly ? { active: true } : {}

        const staff = await prisma.staff.findMany({
            where,
            orderBy: [
                { active: 'desc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                photo: true,
                cpf: true,
                specialties: true,
                commissionPercent: true,
                active: true,
                hireDate: true,
                createdAt: true,
                _count: {
                    select: {
                        services: true
                    }
                }
            }
        })

        return NextResponse.json({ success: true, data: staff })

    } catch (error) {
        console.error('Erro ao listar funcionários:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar funcionários' },
            { status: 500 }
        )
    }
}

// POST - Criar novo funcionário
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            name,
            email,
            phone,
            photo,
            cpf,
            specialties,
            commissionPercent,
            hireDate
        } = body

        // Validações
        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Nome é obrigatório' },
                { status: 400 }
            )
        }

        if (!specialties || specialties.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Selecione pelo menos uma especialidade' },
                { status: 400 }
            )
        }

        // Verificar se CPF já existe
        if (cpf) {
            const existingStaff = await prisma.staff.findUnique({
                where: { cpf }
            })

            if (existingStaff) {
                return NextResponse.json(
                    { success: false, error: 'CPF já cadastrado' },
                    { status: 400 }
                )
            }
        }

        // Verificar se email já existe
        if (email) {
            const existingStaff = await prisma.staff.findUnique({
                where: { email }
            })

            if (existingStaff) {
                return NextResponse.json(
                    { success: false, error: 'Email já cadastrado' },
                    { status: 400 }
                )
            }
        }

        // Criar funcionário
        const staff = await prisma.staff.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                photo: photo || null,
                cpf: cpf || null,
                specialties,
                commissionPercent: commissionPercent || 30,
                hireDate: hireDate ? new Date(hireDate) : new Date(),
                active: true
            }
        })

        return NextResponse.json({
            success: true,
            data: staff,
            message: 'Funcionário cadastrado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao criar funcionário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar funcionário' },
            { status: 500 }
        )
    }
}

// PATCH - Atualizar funcionário
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { id, ...data } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do funcionário não fornecido' },
                { status: 400 }
            )
        }

        // Verificar se funcionário existe
        const existingStaff = await prisma.staff.findUnique({
            where: { id }
        })

        if (!existingStaff) {
            return NextResponse.json(
                { success: false, error: 'Funcionário não encontrado' },
                { status: 404 }
            )
        }

        // Se está mudando CPF, verificar se novo CPF já existe
        if (data.cpf && data.cpf !== existingStaff.cpf) {
            const cpfExists = await prisma.staff.findUnique({
                where: { cpf: data.cpf }
            })

            if (cpfExists) {
                return NextResponse.json(
                    { success: false, error: 'CPF já cadastrado' },
                    { status: 400 }
                )
            }
        }

        // Se está mudando email, verificar se novo email já existe
        if (data.email && data.email !== existingStaff.email) {
            const emailExists = await prisma.staff.findUnique({
                where: { email: data.email }
            })

            if (emailExists) {
                return NextResponse.json(
                    { success: false, error: 'Email já cadastrado' },
                    { status: 400 }
                )
            }
        }

        // Atualizar
        const staff = await prisma.staff.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: staff,
            message: 'Funcionário atualizado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao atualizar funcionário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar funcionário' },
            { status: 500 }
        )
    }
}

// DELETE - Desativar funcionário (soft delete)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do funcionário não fornecido' },
                { status: 400 }
            )
        }

        // Desativar (soft delete)
        const staff = await prisma.staff.update({
            where: { id },
            data: { active: false }
        })

        return NextResponse.json({
            success: true,
            data: staff,
            message: 'Funcionário desativado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao desativar funcionário:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao desativar funcionário' },
            { status: 500 }
        )
    }
}