// app/api/admin/birthdays/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
        const month = searchParams.get('month') || new Date().getMonth() + 1
        const year = searchParams.get('year') || new Date().getFullYear()

        // Buscar todos os usuários com aniversário neste mês
        const users = await prisma.user.findMany({
            where: {
                birthDate: {
                    not: null
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                birthDate: true,
                createdAt: true
            }
        })

        // Filtrar aniversariantes do mês
        const birthdays = await Promise.all(
            users
                .filter(user => {
                    if (!user.birthDate) return false
                    const birthMonth = new Date(user.birthDate).getMonth() + 1
                    return birthMonth === Number(month)
                })
                .map(async user => {
                    const birthDate = new Date(user.birthDate!)
                    const today = new Date()

                    const thisYearBirthday = new Date(
                        Number(year),
                        birthDate.getMonth(),
                        birthDate.getDate()
                    )

                    const daysUntil = Math.ceil(
                        (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    )

                    const age = Number(year) - birthDate.getFullYear()

                    // 🔥 BUSCA TODOS OS AGENDAMENTOS (sem filtro de status)
                    const appointments = await prisma.appointment.findMany({
                        where: {
                            userId: user.id
                        },
                        include: {
                            service: {
                                select: {
                                    name: true
                                }
                            }
                        },
                        orderBy: {
                            date: 'asc' // ⚠️ MUDADO PARA ASC para pegar o primeiro cronologicamente
                        }
                    })

                    console.log(`👤 ${user.name} - Total de agendamentos encontrados: ${appointments.length}`)

                    // Primeiro agendamento (mais antigo)
                    const firstAppointment = appointments.length > 0 ? appointments[0] : null

                    // Último agendamento (mais recente)
                    const lastAppointment = appointments.length > 0
                        ? appointments[appointments.length - 1]
                        : null

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        birthDate: user.birthDate,
                        birthDay: birthDate.getDate(),
                        birthMonth: birthDate.getMonth() + 1,
                        age,
                        daysUntil,
                        isPast: daysUntil < 0,
                        isToday: daysUntil === 0,
                        clientSince: firstAppointment?.date || user.createdAt,
                        totalAppointments: appointments.length,
                        lastAppointment: lastAppointment
                            ? {
                                date: lastAppointment.date,
                                service: lastAppointment.service
                            }
                            : null
                    }
                })
        )

        // Estatísticas
        const stats = {
            total: birthdays.length,
            upcoming: birthdays.filter(b => b.daysUntil >= 0 && b.daysUntil <= 7).length,
            today: birthdays.filter(b => b.isToday).length,
            thisWeek: birthdays.filter(b => b.daysUntil >= 0 && b.daysUntil <= 7).length
        }

        return NextResponse.json({
            success: true,
            data: birthdays,
            stats,
            month: parseInt(month.toString()),
            year: parseInt(year.toString())
        })

    } catch (error) {
        console.error('❌ Erro ao buscar aniversariantes:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar aniversariantes',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}