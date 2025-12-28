import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, message: 'Não autorizado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            searchTerm = '',
            services = [],
            statuses = [],
            dateRange = { preset: 'all', start: null, end: null },
            timeOfDay = [],
            paymentMethods = [],
            sortBy = 'date',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = body

        // Construir filtros dinâmicos
        const andConditions: Prisma.AppointmentWhereInput[] = []

        // Filtro de busca (nome, email, telefone, ID)
        if (searchTerm) {
            andConditions.push({
                OR: [
                    { id: { contains: searchTerm, mode: 'insensitive' } },
                    { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
                    { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
                    { user: { phone: { contains: searchTerm.replace(/\D/g, '') } } }
                ]
            })
        }

        // Filtro de serviços
        if (services.length > 0) {
            andConditions.push({
                serviceId: { in: services }
            })
        }

        // Filtro de status
        if (statuses.length > 0) {
            andConditions.push({
                status: { in: statuses }
            })
        }

        // Filtro de data
        if (dateRange.preset !== 'all') {
            const now = new Date()
            let startDate: Date | null = null
            let endDate: Date | null = null

            switch (dateRange.preset) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0))
                    endDate = new Date(now.setHours(23, 59, 59, 999))
                    break

                case 'week':
                    const firstDayOfWeek = new Date(now)
                    firstDayOfWeek.setDate(now.getDate() - now.getDay())
                    firstDayOfWeek.setHours(0, 0, 0, 0)
                    startDate = firstDayOfWeek
                    endDate = new Date(now.setHours(23, 59, 59, 999))
                    break

                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
                    break

                case 'custom':
                    if (dateRange.start) {
                        startDate = new Date(dateRange.start)
                        startDate.setHours(0, 0, 0, 0)
                    }
                    if (dateRange.end) {
                        endDate = new Date(dateRange.end)
                        endDate.setHours(23, 59, 59, 999)
                    }
                    break
            }

            if (startDate || endDate) {
                andConditions.push({
                    date: {
                        ...(startDate && { gte: startDate }),
                        ...(endDate && { lte: endDate })
                    }
                })
            }
        }

        // Filtro de período do dia
        if (timeOfDay.length > 0) {
            const timeConditions = timeOfDay.map(period => {
                switch (period) {
                    case 'morning':
                        return { time: { gte: '06:00', lt: '12:00' } }
                    case 'afternoon':
                        return { time: { gte: '12:00', lt: '18:00' } }
                    case 'evening':
                        return { time: { gte: '18:00', lte: '23:00' } }
                    default:
                        return {}
                }
            })

            if (timeConditions.length > 0) {
                andConditions.push({ OR: timeConditions })
            }
        }

        // Filtro de forma de pagamento (se você tiver esse campo)
        if (paymentMethods.length > 0) {
            andConditions.push({
                paymentMethod: { in: paymentMethods }
            })
        }

        // Construir where final
        const where: Prisma.AppointmentWhereInput = andConditions.length > 0
            ? { AND: andConditions }
            : {}

        // Definir ordenação
        let orderBy: Prisma.AppointmentOrderByWithRelationInput = {}

        switch (sortBy) {
            case 'date':
                orderBy = { date: sortOrder, time: sortOrder }
                break
            case 'price':
                orderBy = { service: { price: sortOrder } }
                break
            case 'name':
                orderBy = { user: { name: sortOrder } }
                break
            default:
                orderBy = { createdAt: sortOrder }
        }

        // Buscar agendamentos com paginação
        const skip = (page - 1) * limit

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            image: true
                        }
                    },
                    service: {
                        select: {
                            name: true,
                            price: true,
                            duration: true
                        }
                    }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.appointment.count({ where })
        ])

        // Calcular estatísticas dos resultados filtrados
        const stats = {
            total,
            pending: await prisma.appointment.count({
                where: { ...where, status: 'PENDING' }
            }),
            confirmed: await prisma.appointment.count({
                where: { ...where, status: 'CONFIRMED' }
            }),
            completed: await prisma.appointment.count({
                where: { ...where, status: 'COMPLETED' }
            }),
            cancelled: await prisma.appointment.count({
                where: { ...where, status: 'CANCELLED' }
            }),
            totalValue: appointments.reduce((sum, apt) => sum + apt.service.price, 0)
        }

        return NextResponse.json({
            success: true,
            data: {
                appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                stats
            }
        })

    } catch (error) {
        console.error('❌ Erro na busca:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Erro ao buscar agendamentos',
                error: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}