// app/api/admin/blocked-times/route.ts - CORREÇÃO FINAL

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// LISTAR todos os bloqueios
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const type = searchParams.get('type')

        const where: any = {}

        // Filtrar por tipo
        if (type) {
            where.type = type
        }

        // Filtrar por período (para bloqueios pontuais)
        if (startDate && endDate) {
            where.OR = [
                // Bloqueios pontuais no período
                {
                    isRecurring: false,
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                    }
                },
                // Bloqueios recorrentes (sempre retornar)
                {
                    isRecurring: true
                }
            ]
        }

        const blockedTimes = await prisma.blockedTime.findMany({
            where,
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [
                { isRecurring: 'desc' },
                { date: 'asc' }
            ]
        })

        return NextResponse.json({
            success: true,
            data: blockedTimes
        })

    } catch (error) {
        console.error('❌ Erro ao buscar horários bloqueados:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar horários bloqueados',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

// CRIAR novo bloqueio
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        // ✅ CORREÇÃO: Buscar usuário completo do banco para pegar o ID real
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Usuário não encontrado no banco de dados' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            type,
            date,
            startTime,
            endTime,
            dayOfWeek,
            isRecurring,
            reason,
            description,
            startDate,
            endDate
        } = body

        // Validações
        if (!type || !reason) {
            return NextResponse.json(
                { success: false, message: 'Tipo e motivo são obrigatórios' },
                { status: 400 }
            )
        }

        if (isRecurring) {
            // Bloqueio recorrente precisa de dayOfWeek
            if (dayOfWeek === undefined || dayOfWeek === null) {
                return NextResponse.json(
                    { success: false, message: 'Dia da semana é obrigatório para bloqueios recorrentes' },
                    { status: 400 }
                )
            }
        } else {
            // ✅ CORREÇÃO: Data é OPCIONAL para bloqueios pontuais
            // Permite bloquear "qualquer data" se não especificar
        }

        // Verificar conflitos com agendamentos existentes
        if (!isRecurring && date) {
            const conflictingAppointments = await prisma.appointment.findMany({
                where: {
                    date: new Date(date),
                    status: {
                        in: ['PENDING', 'CONFIRMED']
                    },
                    ...(startTime && endTime ? {
                        time: {
                            gte: startTime,
                            lte: endTime
                        }
                    } : {})
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true
                        }
                    },
                    service: {
                        select: {
                            name: true
                        }
                    }
                }
            })

            if (conflictingAppointments.length > 0) {
                return NextResponse.json({
                    success: false,
                    message: 'Existem agendamentos confirmados neste horário',
                    conflictingAppointments: conflictingAppointments.map(apt => ({
                        id: apt.id,
                        clientName: apt.user.name,
                        clientPhone: apt.user.phone,
                        serviceName: apt.service.name,
                        time: apt.time,
                        status: apt.status
                    }))
                }, { status: 409 })
            }
        }

        // Criar bloqueio
        const blockedTime = await prisma.blockedTime.create({
            data: {
                type,
                date: date ? new Date(date) : null,
                startTime: startTime || null,
                endTime: endTime || null,
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
                isRecurring: isRecurring || false,
                reason,
                description: description || null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                createdBy: user.id // ✅ CORREÇÃO: Usar user.id do banco, não session.user.id
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: blockedTime,
            message: 'Horário bloqueado com sucesso'
        }, { status: 201 })

    } catch (error) {
        console.error('❌ Erro ao criar bloqueio:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao criar bloqueio',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}