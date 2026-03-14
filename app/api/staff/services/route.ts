// app/api/staff/services/route.ts
// API de Comanda - Registrar serviços executados

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar serviços executados
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
        const staffId = searchParams.get('staffId')
        const date = searchParams.get('date')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const unpaidOnly = searchParams.get('unpaid') === 'true'

        const where: any = {}

        if (staffId) {
            where.staffId = staffId
        }

        if (date) {
            const dateObj = new Date(date)
            const nextDay = new Date(dateObj)
            nextDay.setDate(nextDay.getDate() + 1)

            where.executedAt = {
                gte: dateObj,
                lt: nextDay
            }
        } else if (startDate && endDate) {
            where.executedAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        if (unpaidOnly) {
            where.commissionPaid = false
        }

        const services = await prisma.staffService.findMany({
            where,
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        photo: true,
                        commissionPercent: true
                    }
                },
                service: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        duration: true
                    }
                },
                combo: {
                    select: {
                        id: true,
                        name: true,
                        discountPercent: true
                    }
                }
            },
            orderBy: {
                executedAt: 'desc'
            }
        })

        // Calcular totais
        const totals = services.reduce((acc, service) => {
            acc.totalRevenue += service.serviceValue
            acc.totalCommission += service.commissionValue
            acc.count += 1
            return acc
        }, { totalRevenue: 0, totalCommission: 0, count: 0 })

        return NextResponse.json({
            success: true,
            data: services,
            totals
        })

    } catch (error) {
        console.error('Erro ao listar serviços:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar serviços' },
            { status: 500 }
        )
    }
}

// POST - Registrar novo serviço executado
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
            staffId,
            serviceId,
            comboId,
            appointmentId, // ✅ ADICIONAR appointmentId
            clientName,
            clientPhone,
            serviceValue,
            paymentMethod,
            executedAt,
            notes
        } = body

        // Validações
        if (!staffId) {
            return NextResponse.json(
                { success: false, error: 'Selecione um funcionário' },
                { status: 400 }
            )
        }

        if (!serviceId && !comboId) {
            return NextResponse.json(
                { success: false, error: 'Selecione um serviço ou combo' },
                { status: 400 }
            )
        }

        if (!clientName) {
            return NextResponse.json(
                { success: false, error: 'Nome do cliente é obrigatório' },
                { status: 400 }
            )
        }

        if (!serviceValue || serviceValue <= 0) {
            return NextResponse.json(
                { success: false, error: 'Valor do serviço inválido' },
                { status: 400 }
            )
        }

        // ✅ VERIFICAR SE JÁ FOI REGISTRADO (evitar duplicação)
        if (appointmentId) {
            const existingRecord = await prisma.staffService.findFirst({
                where: {
                    staffId,
                    appointmentId
                }
            })

            if (existingRecord) {
                return NextResponse.json(
                    { success: false, error: 'Este agendamento já foi registrado para este funcionário' },
                    { status: 400 }
                )
            }
        }

        // Buscar funcionário para pegar % de comissão
        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        })

        if (!staff) {
            return NextResponse.json(
                { success: false, error: 'Funcionário não encontrado' },
                { status: 404 }
            )
        }

        // Calcular comissão
        const commissionValue = (serviceValue * staff.commissionPercent) / 100

        // Registrar serviço
        const staffService = await prisma.staffService.create({
            data: {
                staffId,
                appointmentId: appointmentId || null, // ✅ ADICIONAR appointmentId
                serviceId: serviceId || null,
                comboId: comboId || null,
                clientName,
                clientPhone: clientPhone || null,
                serviceValue,
                commissionValue,
                paymentMethod: paymentMethod || 'DINHEIRO',
                executedAt: executedAt ? new Date(executedAt) : new Date(),
                notes: notes || null
            },
            include: {
                staff: true,
                service: true,
                combo: true
            }
        })

        // Atualizar relatório mensal
        const date = new Date(executedAt || new Date())
        const year = date.getFullYear()
        const month = date.getMonth() + 1

        await updateMonthlyReport(staffId, year, month)

        return NextResponse.json({
            success: true,
            data: staffService,
            message: 'Serviço registrado com sucesso!'
        })

    } catch (error) {
        console.error('Erro ao registrar serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao registrar serviço' },
            { status: 500 }
        )
    }
}

// PATCH - Marcar comissão como paga
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { ids } = body

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'IDs inválidos' },
                { status: 400 }
            )
        }

        // Atualizar múltiplos registros
        const updated = await prisma.staffService.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                commissionPaid: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updated
        })

    } catch (error) {
        console.error('Erro ao marcar como pago:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao marcar como pago' },
            { status: 500 }
        )
    }
}

// DELETE - Remover serviço registrado
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
                { success: false, error: 'ID não fornecido' },
                { status: 400 }
            )
        }

        // Buscar serviço antes de deletar (para atualizar relatório)
        const service = await prisma.staffService.findUnique({
            where: { id }
        })

        if (!service) {
            return NextResponse.json(
                { success: false, error: 'Serviço não encontrado' },
                { status: 404 }
            )
        }

        // Deletar
        await prisma.staffService.delete({
            where: { id }
        })

        // Atualizar relatório mensal
        const date = new Date(service.executedAt)
        const year = date.getFullYear()
        const month = date.getMonth() + 1

        await updateMonthlyReport(service.staffId, year, month)

        return NextResponse.json({
            success: true,
            message: 'Serviço removido com sucesso'
        })

    } catch (error) {
        console.error('Erro ao remover serviço:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao remover serviço' },
            { status: 500 }
        )
    }
}

// ============================================
// FUNÇÃO AUXILIAR: Atualizar relatório mensal
// ============================================
async function updateMonthlyReport(staffId: string, year: number, month: number) {
    try {
        // Buscar todos os serviços do mês
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const services = await prisma.staffService.findMany({
            where: {
                staffId,
                executedAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        // Calcular totais
        const totals = services.reduce((acc, service) => {
            acc.totalServices += 1
            acc.totalRevenue += service.serviceValue
            acc.totalCommission += service.commissionValue
            return acc
        }, { totalServices: 0, totalRevenue: 0, totalCommission: 0 })

        // Criar ou atualizar relatório
        await prisma.staffMonthlyReport.upsert({
            where: {
                staffId_year_month: {
                    staffId,
                    year,
                    month
                }
            },
            create: {
                staffId,
                year,
                month,
                ...totals
            },
            update: {
                ...totals,
                updatedAt: new Date()
            }
        })

        console.log(`✅ Relatório mensal atualizado: ${staffId} - ${month}/${year}`)
    } catch (error) {
        console.error('Erro ao atualizar relatório mensal:', error)
    }
}